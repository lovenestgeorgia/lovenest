import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getGemini, TEXT_MODEL, generateImage } from "@/lib/gemini";
import {
    PANEL_SCRIPT_SYSTEM_PROMPT,
    buildPanelImagePrompt,
    buildCharacterSheetPrompt,
} from "@/lib/comic/prompts";
import { getStyleById } from "@/lib/comic/styles";
import { CHARACTER_BUCKET, PANEL_BUCKET, panelPath } from "@/lib/comic/storage";

export const runtime = "nodejs";
export const maxDuration = 300;

function sseEncode(obj) {
    return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(_req, { params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("unauthenticated", { status: 401 });

    const admin = getSupabaseAdmin();

    const [{ data: project }, { data: characters }, { data: messages }, { data: existingPanels }] = await Promise.all([
        supabase.from("comic_projects").select("*").eq("id", id).single(),
        supabase
            .from("comic_characters")
            .select("name, description, persona, wardrobe, reference_image_path")
            .eq("project_id", id),
        supabase
            .from("comic_messages")
            .select("role, content")
            .eq("project_id", id)
            .order("created_at"),
        supabase.from("comic_panels").select("id").eq("project_id", id),
    ]);

    if (!project) return new Response("not found", { status: 404 });
    if (project.user_id !== user.id) return new Response("forbidden", { status: 403 });

    const style = getStyleById(project.style_id);
    if (!style) return new Response("style not selected", { status: 400 });

    if ((existingPanels || []).length > 0) {
        const encoder = new TextEncoder();
        return new Response(
            new ReadableStream({
                start(controller) {
                    controller.enqueue(
                        encoder.encode(
                            sseEncode({ type: "status", message: "უკვე იხატება, ვაკონტროლებთ..." })
                        )
                    );
                    controller.close();
                },
            }),
            {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache, no-transform",
                },
            }
        );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (event) => {
                try {
                    controller.enqueue(encoder.encode(sseEncode(event)));
                } catch {
                    /* client disconnected; server keeps running */
                }
            };

            try {
                await admin
                    .from("comic_projects")
                    .update({ status: "generating" })
                    .eq("id", id);

                send({ type: "status", message: "სცენარის შედგენა..." });

                // ===== 1. Script generation (Gemini text JSON) =====
                const storyContext = [
                    project.story_text ? `STORY SUMMARY:\n${project.story_text}` : null,
                    messages?.length
                        ? `INTERVIEW TRANSCRIPT:\n${messages.map((m) => `${m.role}: ${m.content}`).join("\n")}`
                        : null,
                    characters?.length
                        ? `CAST:\n${characters.map((c) => `- ${c.name}: ${c.description}. ${c.persona}`).join("\n")}`
                        : null,
                    `Produce exactly ${project.panel_count} STORY panels plus 1 cover + 1 closing = ${project.panel_count + 2} total panels.`,
                ]
                    .filter(Boolean)
                    .join("\n\n");

                const gemini = getGemini();
                const scriptResult = await gemini.models.generateContent({
                    model: TEXT_MODEL,
                    contents: [{ role: "user", parts: [{ text: storyContext }] }],
                    config: {
                        systemInstruction: PANEL_SCRIPT_SYSTEM_PROMPT,
                        responseMimeType: "application/json",
                    },
                });

                const scriptText = scriptResult?.text || "{}";
                const script = JSON.parse(scriptText);
                const title = (script.title || project.title || "My Comic").slice(0, 80);
                const subtitle = (script.subtitle || "").slice(0, 160);
                const scriptPanels = Array.isArray(script.panels) ? script.panels : [];

                if (!scriptPanels.length) {
                    throw new Error("AI failed to produce a panel script");
                }

                const total = scriptPanels.length;
                const normalized = scriptPanels.map((p, idx) => {
                    let pageType = p.page_type;
                    if (idx === 0) pageType = "cover";
                    else if (idx === total - 1) pageType = "closing";
                    else if (pageType !== "story") pageType = "story";
                    return {
                        ord: idx + 1,
                        page_type: pageType,
                        characters_in_scene: Array.isArray(p.characters_in_scene)
                            ? p.characters_in_scene
                            : [],
                        actions: Array.isArray(p.actions) ? p.actions : [],
                        scene_description: p.scene_description || p.scene_prompt || "",
                        location: typeof p.location === "string" ? p.location : "",
                        dialogue: Array.isArray(p.dialogue) ? p.dialogue : [],
                        caption: p.caption || "",
                    };
                });

                // Persist wardrobe per character — locks their outfit across panels
                const wardrobeMap =
                    script.wardrobe && typeof script.wardrobe === "object"
                        ? script.wardrobe
                        : {};
                if (characters?.length) {
                    await Promise.all(
                        characters.map((c) => {
                            const outfit = wardrobeMap[c.name];
                            if (!outfit) return null;
                            return admin
                                .from("comic_characters")
                                .update({ wardrobe: outfit })
                                .eq("project_id", id)
                                .eq("name", c.name);
                        })
                    );
                    // Update our in-memory copy too so the rest of this run uses it
                    characters.forEach((c) => {
                        if (wardrobeMap[c.name]) c.wardrobe = wardrobeMap[c.name];
                    });
                }

                await admin
                    .from("comic_projects")
                    .update({ title, subtitle })
                    .eq("id", id);

                // ===== 2. Insert panel rows =====
                await admin.from("comic_panels").delete().eq("project_id", id);
                const { data: panelRows, error: insErr } = await admin
                    .from("comic_panels")
                    .insert(
                        normalized.map((p) => ({
                            project_id: id,
                            ord: p.ord,
                            page_type: p.page_type,
                            scene_prompt: p.scene_description,
                            caption: p.caption,
                            dialogue: p.dialogue,
                            actions: p.actions,
                            location: p.location,
                            status: "pending",
                        }))
                    )
                    .select("id, ord, page_type");
                if (insErr) throw insErr;

                send({
                    type: "script-ready",
                    title,
                    subtitle,
                    panels: panelRows.map((p) => ({
                        id: p.id,
                        ord: p.ord,
                        page_type: p.page_type,
                    })),
                });

                // ===== 3. Pre-fetch character reference photos as base64 =====
                // Each cache entry is an ARRAY of references for that character.
                // We use the original photo (identity anchor) plus a generated
                // "character sheet" (style anchor) per character. The sheet is
                // a one-shot portrait in the chosen art style so every panel
                // sees a consistent stylized version of each person.
                const refCache = new Map(); // name -> [{ base64, mimeType }, ...]
                for (const c of characters || []) {
                    if (!c.reference_image_path) continue;
                    try {
                        const { data: blob } = await admin.storage
                            .from(CHARACTER_BUCKET)
                            .download(c.reference_image_path);
                        if (!blob) continue;
                        const buf = Buffer.from(await blob.arrayBuffer());
                        refCache.set(c.name, [
                            {
                                base64: buf.toString("base64"),
                                mimeType: blob.type || "image/png",
                            },
                        ]);
                    } catch (e) {
                        console.warn(`ref image fetch failed for ${c.name}:`, e.message);
                    }
                }

                // ===== 3b. Generate styled character sheets =====
                send({ type: "status", message: "პერსონაჟების სტილიზაცია..." });
                await Promise.all(
                    (characters || []).map(async (c) => {
                        const photoRef = refCache.get(c.name)?.[0];
                        if (!photoRef) return;
                        try {
                            const sheetPrompt = buildCharacterSheetPrompt({
                                stylePrefix: style.promptPrefix,
                                character: c,
                            });
                            const { base64, mimeType } = await generateImage({
                                prompt: sheetPrompt,
                                referenceImages: [photoRef],
                                aspectRatio: "1:1",
                            });
                            // Prepend the sheet so it becomes the primary visual reference,
                            // followed by the original photo for face/identity grounding.
                            refCache.set(c.name, [
                                { base64, mimeType: mimeType || "image/png" },
                                photoRef,
                            ]);
                        } catch (e) {
                            console.warn(`character sheet failed for ${c.name}:`, e.message);
                            // Fall back to just the photo — already in refCache
                        }
                    })
                );

                // ===== 4. Generate images with bounded concurrency =====
                const CONCURRENCY = 2;
                let cursor = 0;

                async function generateOne(row, scriptIdx) {
                    const scriptPanel = normalized[scriptIdx];
                    await admin
                        .from("comic_panels")
                        .update({ status: "generating" })
                        .eq("id", row.id);
                    send({
                        type: "panel-start",
                        id: row.id,
                        ord: row.ord,
                        page_type: row.page_type,
                    });

                    try {
                        const prompt = buildPanelImagePrompt({
                            stylePrefix: style.promptPrefix,
                            coverTypography: style.coverTypography,
                            pageType: row.page_type,
                            title,
                            subtitle,
                            sceneDescription: scriptPanel.scene_description,
                            location: scriptPanel.location,
                            actions: scriptPanel.actions,
                            dialogue: scriptPanel.dialogue,
                            caption: scriptPanel.caption,
                            charactersInScene: scriptPanel.characters_in_scene,
                            characters: characters || [],
                        });

                        // Collect reference images for characters in this scene.
                        // Each character contributes [styled sheet, original photo].
                        let refImages = (scriptPanel.characters_in_scene || [])
                            .flatMap((name) => refCache.get(name) || []);

                        // For the cover, pull in references for every character
                        if (refImages.length === 0 && row.page_type === "cover") {
                            refImages = Array.from(refCache.values()).flat();
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
                            panelId: row.id,
                        });
                        const { error: upErr } = await admin.storage
                            .from(PANEL_BUCKET)
                            .upload(path, bytes, {
                                contentType: "image/png",
                                upsert: true,
                            });
                        if (upErr) throw upErr;

                        const { data: signed } = await admin.storage
                            .from(PANEL_BUCKET)
                            .createSignedUrl(path, 60 * 60 * 24 * 30);

                        await admin
                            .from("comic_panels")
                            .update({
                                status: "ready",
                                image_path: path,
                                image_url: signed.signedUrl,
                            })
                            .eq("id", row.id);

                        send({
                            type: "panel-ready",
                            id: row.id,
                            ord: row.ord,
                            image_url: signed.signedUrl,
                        });
                    } catch (err) {
                        console.error("panel generation failed:", err);
                        await admin
                            .from("comic_panels")
                            .update({ status: "failed" })
                            .eq("id", row.id);
                        send({
                            type: "panel-failed",
                            id: row.id,
                            ord: row.ord,
                            error: err.message,
                        });
                    }
                }

                async function worker() {
                    while (cursor < panelRows.length) {
                        const i = cursor++;
                        await generateOne(panelRows[i], i);
                    }
                }

                await Promise.all(
                    Array.from({ length: Math.min(CONCURRENCY, panelRows.length) }, worker)
                );

                await admin
                    .from("comic_projects")
                    .update({ status: "preview" })
                    .eq("id", id);
                send({ type: "done" });
            } catch (err) {
                console.error("generation pipeline error:", err);
                send({ type: "error", message: err.message });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}
