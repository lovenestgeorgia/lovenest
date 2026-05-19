import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateImage } from "@/lib/gemini";
import { generatePanelArt } from "@/lib/comic/imageProvider";
import { buildPanelImagePrompt, buildTextOverlayPrompt } from "@/lib/comic/prompts";
import { getStyleById } from "@/lib/comic/styles";
import { CHARACTER_BUCKET, PANEL_BUCKET, panelPath } from "@/lib/comic/storage";
import { critiquePanel } from "@/lib/comic/critic";
import { classifyRegenComment } from "@/lib/comic/classify";
import { normalizeRefImage } from "@/lib/comic/imageNormalize";
import { notifyFailure } from "@/lib/comic/notify";

export const runtime = "nodejs";
// 240s lets a single-panel re-render survive a slow first OpenAI attempt
// (90s timeout) + retry + Gemini overlay without hitting Vercel's wall.
export const maxDuration = 240;

// Hard cap on how many times a single panel can be regenerated. Each call
// hits Nano Banana Pro + optionally a character-sheet generation, so without
// this limit a frustrated user can rack up a tab fast.
const MAX_REGEN_PER_PANEL = 8;

function artPathOf(finalPath) {
    return finalPath?.replace(/\.png$/, ".art.png");
}

async function downloadAsBase64(admin, bucket, path) {
    try {
        const { data: blob } = await admin.storage.from(bucket).download(path);
        if (!blob) return null;
        const buf = Buffer.from(await blob.arrayBuffer());
        // Normalize to clean PNG — uploaded photos may be JPEG/HEIC/WebP
        // which OpenAI's images.edit endpoint rejects with 400.
        return await normalizeRefImage(buf);
    } catch (e) {
        console.warn(`[regenerate] download failed for ${path}:`, e.message);
        return null;
    }
}

// Wall-clock cutoff for running the critic. With maxDuration=240s we want
// the critic + finalization writes to fit under ~140s of prior work; any
// later and we risk a 504. The critic itself takes 6-10s.
const CRITIC_TIME_BUDGET_MS = 140_000;

export async function POST(req, { params }) {
    const startedAt = Date.now();
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
            .select("id, name, description, persona, wardrobe, reference_image_path, character_sheet_path")
            .eq("project_id", id),
    ]);

    if (!project || !panel) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (project.user_id !== user.id) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const style = getStyleById(project.style_id);
    if (!style) return NextResponse.json({ error: "no style" }, { status: 400 });

    if ((panel.revision_count || 0) >= MAX_REGEN_PER_PANEL) {
        return NextResponse.json(
            { error: `regenerate limit reached (${MAX_REGEN_PER_PANEL}) for this panel` },
            { status: 429 }
        );
    }

    const admin = getSupabaseAdmin();
    await admin.from("comic_panels").update({ status: "generating" }).eq("id", panelId);

    const pageType = panel.page_type || "story";
    const needsText =
        pageType === "cover" ||
        (Array.isArray(panel.dialogue) && panel.dialogue.length > 0) ||
        !!panel.caption;

    try {
        // ── CLASSIFY user's correction comment (text-only vs visual) ──
        // Only matters when the user gave us a comment AND this panel
        // actually has text to fix. Without a comment, default to a full redo.
        const classification = needsText
            ? await classifyRegenComment(userComment)
            : { kind: "visual", reason: "no text on this panel" };

        // Try to load the text-free art saved from the prior generation.
        // If it exists AND the user's complaint is text-only, we can skip
        // OpenAI entirely and just re-overlay text with Gemini.
        const artPath = artPathOf(panel.image_path);
        const savedArt = classification.kind === "text" && artPath
            ? await downloadAsBase64(admin, PANEL_BUCKET, artPath)
            : null;

        // Final decision: text-only path requires (a) classifier said "text"
        // (b) the text-free art is on disk and (c) panel actually has text.
        const textOnlyPath = classification.kind === "text" && !!savedArt && needsText;

        let base64;
        let artBase64 = null;
        let artDataUrl = null;

        if (textOnlyPath) {
            // ── TEXT-ONLY: skip OpenAI, only re-run Gemini overlay ──
            console.log(
                `[regenerate] panel ${panel.ord}: text-only fix (skipping OpenAI). reason: ${classification.reason}`
            );
            artBase64 = savedArt.base64;
            artDataUrl = `data:image/png;base64,${artBase64}`;

            const overlayPrompt = buildTextOverlayPrompt({
                pageType,
                dialogue: panel.dialogue,
                caption: panel.caption,
                title: project.title,
                subtitle: project.subtitle || "",
                coverTypography: style.coverTypography,
                stylePrefix: style.promptPrefix,
                userCorrection: userComment,
            });
            const overlayResult = await generateImage({
                prompt: overlayPrompt,
                referenceImages: [{ base64: artBase64, mimeType: "image/png" }],
                aspectRatio: "2:3",
            });
            base64 = overlayResult.base64;
        } else {
            // ── FULL PIPELINE: PASS 1 (OpenAI) + PASS 2 (Gemini) ──
            console.log(
                `[regenerate] panel ${panel.ord}: full redo. classification=${classification.kind}, reason: ${classification.reason}`
            );

            const prompt = buildPanelImagePrompt({
                stylePrefix: style.promptPrefix,
                coverTypography: style.coverTypography,
                pageType,
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
                const prev = await downloadAsBase64(admin, PANEL_BUCKET, panel.image_path);
                if (prev) refImages.push(prev);
            }

            // Use the cached character sheet from the bulk run if it exists.
            // Never generate a fresh sheet on a per-panel retry — that adds
            // 30-120s per character to every retry and frequently times out.
            for (const c of characters || []) {
                if (!c.reference_image_path) continue;

                if (c.character_sheet_path) {
                    const sheet = await downloadAsBase64(admin, CHARACTER_BUCKET, c.character_sheet_path);
                    if (sheet) refImages.push(sheet);
                }

                const photo = await downloadAsBase64(admin, CHARACTER_BUCKET, c.reference_image_path);
                if (photo) refImages.push(photo);
            }

            // ── PASS 1: text-free panel art (provider per IMAGE_PROVIDER env) ──
            const artResult = await generatePanelArt({
                prompt,
                referenceImages: refImages,
                aspectRatio: "2:3",
            });
            base64 = artResult.base64;
            artBase64 = artResult.base64;
            if (needsText) artDataUrl = `data:image/png;base64,${base64}`;

            // ── PASS 2: Gemini Nano Banana Pro adds Georgian text ──
            if (needsText) {
                try {
                    const overlayPrompt = buildTextOverlayPrompt({
                        pageType,
                        dialogue: panel.dialogue,
                        caption: panel.caption,
                        title: project.title,
                        subtitle: project.subtitle || "",
                        coverTypography: style.coverTypography,
                        stylePrefix: style.promptPrefix,
                        userCorrection: classification.kind === "both" ? userComment : "",
                    });
                    const overlayResult = await generateImage({
                        prompt: overlayPrompt,
                        referenceImages: [{ base64, mimeType: "image/png" }],
                        aspectRatio: "2:3",
                    });
                    base64 = overlayResult.base64;
                } catch (e) {
                    console.warn(`[regenerate] text overlay failed, keeping bare art:`, e.message);
                }
            }
        }

        // ── Upload final + text-free art alongside it ──
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

        // Persist the new text-free art too, so the next text-only retry can
        // skip OpenAI again. Skip if there was no separate art (closing pages
        // without text never produced a distinct art version).
        if (artBase64 && artBase64 !== base64) {
            try {
                await admin.storage
                    .from(PANEL_BUCKET)
                    .upload(artPathOf(path), Buffer.from(artBase64, "base64"), {
                        contentType: "image/png",
                        upsert: true,
                    });
            } catch (e) {
                console.warn(`[regenerate] art-only upload failed:`, e.message);
            }
        }

        const { data: signed } = await admin.storage
            .from(PANEL_BUCKET)
            .createSignedUrl(path, 60 * 60 * 24 * 30);

        // Critic pass runs only if we're well within the wall-clock budget.
        // On user-initiated regenerates the customer is making the judgment
        // call anyway, so skipping the 6-10s critic when we're already over
        // ~110s of work prevents a 504 on slow OpenAI/Gemini days.
        let critique = panel.critique || null;
        if (Date.now() - startedAt < CRITIC_TIME_BUDGET_MS) {
            try {
                critique = await critiquePanel({
                    imageBase64: base64,
                    mimeType: "image/png",
                    pageType,
                    dialogue: panel.dialogue,
                    caption: panel.caption,
                    title: pageType === "cover" ? project.title : "",
                    characters: characters || [],
                });
            } catch (e) {
                console.warn("[regenerate] critic failed:", e.message);
            }
        } else {
            console.log("[regenerate] critic skipped — wall-clock budget");
        }

        const { data: updated } = await admin
            .from("comic_panels")
            .update({
                status: "ready",
                image_path: path,
                image_url: signed.signedUrl,
                revision_count: (panel.revision_count || 0) + 1,
                is_hq: !!project.paid_digital,
                critique,
            })
            .eq("id", panelId)
            .select("*")
            .single();

        return NextResponse.json({
            panel: updated,
            image_url: signed.signedUrl,
            art_data_url: artDataUrl,
            classification,
            critique,
        });
    } catch (err) {
        console.error("regenerate failed:", err);
        await admin.from("comic_panels").update({ status: "failed" }).eq("id", panelId);
        await notifyFailure({
            title: "კადრის გადახატვა ჩავარდა",
            project: { id, title: project?.title },
            user,
            reason: `Panel №${String(panel?.ord ?? "?").padStart(2, "0")} regenerate failed`,
            details: err.message,
        });
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
