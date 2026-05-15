import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateImage } from "@/lib/gemini";
import { buildPanelImagePrompt, buildCharacterSheetPrompt } from "@/lib/comic/prompts";
import { getStyleById } from "@/lib/comic/styles";
import { CHARACTER_BUCKET, PANEL_BUCKET, panelPath } from "@/lib/comic/storage";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req, { params }) {
    const { id, panelId } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const userComment = typeof body.comment === "string" ? body.comment.trim().slice(0, 600) : "";

    const [{ data: project }, { data: panel }, { data: characters }] = await Promise.all([
        supabase.from("comic_projects").select("*").eq("id", id).single(),
        supabase.from("comic_panels").select("*").eq("id", panelId).eq("project_id", id).single(),
        supabase
            .from("comic_characters")
            .select("name, description, persona, wardrobe, reference_image_path")
            .eq("project_id", id),
    ]);

    if (!project || !panel) return NextResponse.json({ error: "not found" }, { status: 404 });
    const style = getStyleById(project.style_id);
    if (!style) return NextResponse.json({ error: "no style" }, { status: 400 });

    const admin = getSupabaseAdmin();
    await admin.from("comic_panels").update({ status: "generating" }).eq("id", panelId);

    try {
        const prompt = buildPanelImagePrompt({
            stylePrefix: style.promptPrefix,
            coverTypography: style.coverTypography,
            pageType: panel.page_type || "story",
            title: project.title,
            subtitle: project.subtitle || "",
            sceneDescription: panel.scene_prompt,
            location: panel.location || "",
            actions: panel.actions || [],
            dialogue: panel.dialogue || [],
            caption: panel.caption,
            charactersInScene: (characters || []).map((c) => c.name),
            characters: characters || [],
            userComment,
        });

        // When the user supplied a correction note, prepend the EXISTING
        // panel image as the first reference so this becomes an edit operation
        // (Nano Banana does an img2img-style fix rather than a fresh generate).
        const refImages = [];
        if (userComment && panel.image_path) {
            try {
                const { data: prevBlob } = await admin.storage
                    .from(PANEL_BUCKET)
                    .download(panel.image_path);
                if (prevBlob) {
                    const buf = Buffer.from(await prevBlob.arrayBuffer());
                    refImages.push({
                        base64: buf.toString("base64"),
                        mimeType: prevBlob.type || "image/png",
                    });
                }
            } catch (e) {
                console.warn("prev panel download failed:", e.message);
            }
        }

        // Load original photos + freshly stylized character sheets so the
        // single-panel regen has the same anchors as the bulk pipeline.
        for (const c of characters || []) {
            if (!c.reference_image_path) continue;
            try {
                const { data: blob } = await admin.storage
                    .from(CHARACTER_BUCKET)
                    .download(c.reference_image_path);
                if (!blob) continue;
                const buf = Buffer.from(await blob.arrayBuffer());
                const photoRef = {
                    base64: buf.toString("base64"),
                    mimeType: blob.type || "image/png",
                };

                // Generate a styled character sheet to lock the in-style look
                try {
                    const sheetPrompt = buildCharacterSheetPrompt({
                        stylePrefix: style.promptPrefix,
                        character: c,
                    });
                    const sheet = await generateImage({
                        prompt: sheetPrompt,
                        referenceImages: [photoRef],
                        aspectRatio: "1:1",
                    });
                    refImages.push({
                        base64: sheet.base64,
                        mimeType: sheet.mimeType || "image/png",
                    });
                } catch (e) {
                    console.warn(`sheet skipped for ${c.name}:`, e.message);
                }

                refImages.push(photoRef);
            } catch {}
        }

        const { base64 } = await generateImage({
            prompt,
            referenceImages: refImages,
            aspectRatio: "2:3",
        });

        const bytes = Buffer.from(base64, "base64");
        const path = panelPath({
            userId: user.id,
            projectId: id,
            panelId,
            hq: project.paid_digital,
        });
        await admin.storage.from(PANEL_BUCKET).upload(path, bytes, {
            contentType: "image/png",
            upsert: true,
        });
        const { data: signed } = await admin.storage
            .from(PANEL_BUCKET)
            .createSignedUrl(path, 60 * 60 * 24 * 30);

        const { data: updated } = await admin
            .from("comic_panels")
            .update({
                status: "ready",
                image_path: path,
                image_url: signed.signedUrl,
                revision_count: (panel.revision_count || 0) + 1,
                is_hq: !!project.paid_digital,
            })
            .eq("id", panelId)
            .select("*")
            .single();

        return NextResponse.json({ panel: updated, image_url: signed.signedUrl });
    } catch (err) {
        console.error("regenerate failed:", err);
        await admin.from("comic_panels").update({ status: "failed" }).eq("id", panelId);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
