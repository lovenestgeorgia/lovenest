import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateImage, generateTextWithFallback } from "@/lib/gemini";
import { generatePanelArt, getArtProvider } from "@/lib/comic/imageProvider";
import {
    PANEL_SCRIPT_SYSTEM_PROMPT,
    buildPanelImagePrompt,
    buildCharacterSheetPrompt,
    buildTextOverlayPrompt,
} from "@/lib/comic/prompts";
import { getStyleById } from "@/lib/comic/styles";
import { CHARACTER_BUCKET, PANEL_BUCKET, panelPath, characterSheetPath } from "@/lib/comic/storage";
import { critiquePanel } from "@/lib/comic/critic";
import { downloadAndNormalize } from "@/lib/comic/imageNormalize";

export const runtime = "nodejs";
export const maxDuration = 300;

function sseEncode(obj) {
    return `data: ${JSON.stringify(obj)}\n\n`;
}

// Convert a critic verdict into a plain-English correction note for the
// retry pass. Used as userComment in buildPanelImagePrompt — that prompt
// treats the first attached image as the previous attempt and asks the
// model to fix the listed issues.
function buildCriticCorrection(critique) {
    if (!critique) return "";
    const visual = critique.visual_issues || [];
    const text = (critique.text_check?.bubbles || [])
        .filter((b) => b?.ok === false)
        .map((b) => `speech bubble should say "${b.expected}" but was rendered as "${b.rendered}"`);
    const captionFix =
        critique.text_check?.caption && critique.text_check.caption.ok === false
            ? [
                  `caption should say "${critique.text_check.caption.expected}" but was rendered as "${critique.text_check.caption.rendered}"`,
              ]
            : [];
    const suggestions = critique.suggestions || [];

    const allFixes = [...visual, ...text, ...captionFix, ...suggestions]
        .filter(Boolean)
        .map((s) => s.replace(/\s+/g, " ").trim())
        .filter((s) => s.length > 0);

    if (allFixes.length === 0) return "";
    return `Fix the following problems from the previous attempt: ${allFixes.join("; ")}.`;
}

export async function POST(_req, { params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("unauthenticated", { status: 401 });

    const admin = getSupabaseAdmin();

    const [{ data: project }, { data: characters }, { data: messages }, { data: existingPanels }] = await Promise.all([
        admin.from("comic_projects").select("*").eq("id", id).single(),
        admin
            .from("comic_characters")
            .select("id, name, description, persona, wardrobe, reference_image_path, character_sheet_path")
            .eq("project_id", id),
        admin
            .from("comic_messages")
            .select("role, content")
            .eq("project_id", id)
            .order("created_at"),
        admin.from("comic_panels").select("id").eq("project_id", id),
    ]);

    if (!project) return new Response("not found", { status: 404 });
    if (project.user_id !== user.id) return new Response("forbidden", { status: 403 });

    const style = getStyleById(project.style_id);
    if (!style) {
        console.warn("[generate] no style selected", { id, style_id: project.style_id });
        return new Response(
            JSON.stringify({ error: "no_style", redirect: `/comic/${id}/style` }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    if (!characters || characters.length === 0) {
        console.warn("[generate] no characters found", {
            id,
            user_id: user.id,
            project_user_id: project.user_id,
            chars_len: (characters || []).length,
        });
        return new Response(
            JSON.stringify({ error: "no_characters", redirect: `/comic/${id}/characters` }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    // Atomic claim: only transition into "generating" from a non-generating state.
    // If 0 rows matched, another request beat us to it OR the project is already
    // in generating state — return a polling-style stream the client can latch onto.
    const { data: claimed, error: claimErr } = await admin
        .from("comic_projects")
        .update({ status: "generating" })
        .eq("id", id)
        .neq("status", "generating")
        .select("id")
        .maybeSingle();

    const alreadyRunning = !claimed && !claimErr;
    if (alreadyRunning || (existingPanels || []).length > 0) {
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
                // status is already "generating" from the atomic claim above

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

                // Gemini 2.5 Pro REQUIRES thinking — it rejects budget=0.
                // Cap it to 256 tokens so we get the speedup without paying
                // for an exhaustive thinking pass.
                const scriptResult = await generateTextWithFallback({
                    contents: [{ role: "user", parts: [{ text: storyContext }] }],
                    config: {
                        systemInstruction: PANEL_SCRIPT_SYSTEM_PROMPT,
                        responseMimeType: "application/json",
                        thinkingConfig: { thinkingBudget: 256 },
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
                        camera: typeof p.camera === "string" ? p.camera : "",
                        lighting: typeof p.lighting === "string" ? p.lighting : "",
                        expressions: typeof p.expressions === "string" ? p.expressions : "",
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
                    // Normalize every uploaded photo to a clean PNG. Without
                    // this, JPEG/HEIC/WebP refs make OpenAI's images.edit
                    // return 400 "Invalid image file or mode".
                    const norm = await downloadAndNormalize(
                        admin,
                        CHARACTER_BUCKET,
                        c.reference_image_path
                    );
                    if (norm) refCache.set(c.name, [norm]);
                }

                // ===== 3b. Load cached sheets, or generate + persist new ones =====
                send({ type: "status", message: "პერსონაჟების სტილიზაცია..." });
                await Promise.all(
                    (characters || []).map(async (c) => {
                        const photoRef = refCache.get(c.name)?.[0];
                        if (!photoRef) return;

                        // Fast path: previously generated sheet exists in storage
                        if (c.character_sheet_path) {
                            const norm = await downloadAndNormalize(
                                admin,
                                CHARACTER_BUCKET,
                                c.character_sheet_path
                            );
                            if (norm) {
                                refCache.set(c.name, [norm, photoRef]);
                                return;
                            }
                        }

                        // Slow path: generate fresh sheet and save for future runs
                        try {
                            const sheetPrompt = buildCharacterSheetPrompt({
                                stylePrefix: style.promptPrefix,
                                character: c,
                            });
                            // Character sheets run through the same provider
                            // as panel art (controlled by IMAGE_PROVIDER env).
                            const { base64 } = await generatePanelArt({
                                prompt: sheetPrompt,
                                referenceImages: [photoRef],
                                aspectRatio: "1:1",
                            });
                            const sheetBytes = Buffer.from(base64, "base64");
                            const path = characterSheetPath({
                                userId: user.id,
                                projectId: id,
                                characterId: c.id,
                            });
                            await admin.storage
                                .from(CHARACTER_BUCKET)
                                .upload(path, sheetBytes, {
                                    contentType: "image/png",
                                    upsert: true,
                                });
                            await admin
                                .from("comic_characters")
                                .update({ character_sheet_path: path })
                                .eq("id", c.id);

                            // Sheet just came from the image API as PNG, no
                            // re-encoding needed — but tag it correctly.
                            refCache.set(c.name, [
                                { base64, mimeType: "image/png" },
                                photoRef,
                            ]);
                        } catch (e) {
                            console.warn(`character sheet failed for ${c.name}:`, e.message);
                            // Fall back to just the photo — already in refCache
                        }
                    })
                );

                // ===== 4. Generate images with bounded concurrency =====
                // Three at a time keeps OpenAI happy and recovers cleanly
                // from network blips. Bump in code if you switch providers.
                const PANEL_CONCURRENCY = 3;
                const CONCURRENCY = Math.min(PANEL_CONCURRENCY, panelRows.length);
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
                        // Collect character reference images once
                        let refImages = (scriptPanel.characters_in_scene || [])
                            .flatMap((name) => refCache.get(name) || []);
                        if (refImages.length === 0 && row.page_type === "cover") {
                            refImages = Array.from(refCache.values()).flat();
                        }

                        // Retry loop — if the critic flags the panel as
                        // needs_redo (missing legs, mangled face, wrong text),
                        // automatically regenerate using the critic feedback
                        // as a correction prompt with the bad attempt as a ref.
                        const MAX_PANEL_ATTEMPTS = 2;
                        let base64;
                        let artBase64 = null;
                        let critique = null;
                        let lastBadBase64 = null;

                        for (let attempt = 0; attempt < MAX_PANEL_ATTEMPTS; attempt++) {
                            const isRetry = attempt > 0 && lastBadBase64 && critique;
                            const userComment = isRetry
                                ? buildCriticCorrection(critique)
                                : "";

                            const prompt = buildPanelImagePrompt({
                                stylePrefix: style.promptPrefix,
                                coverTypography: style.coverTypography,
                                pageType: row.page_type,
                                title,
                                subtitle,
                                sceneDescription: scriptPanel.scene_description,
                                location: scriptPanel.location,
                                camera: scriptPanel.camera,
                                lighting: scriptPanel.lighting,
                                expressions: scriptPanel.expressions,
                                actions: scriptPanel.actions,
                                dialogue: scriptPanel.dialogue,
                                caption: scriptPanel.caption,
                                charactersInScene: scriptPanel.characters_in_scene,
                                characters: characters || [],
                                userComment,
                            });

                            // On retry, prepend the bad version as the first
                            // reference image so the model treats this as an
                            // edit-with-correction call.
                            const refsForCall = isRetry
                                ? [{ base64: lastBadBase64, mimeType: "image/png" }, ...refImages]
                                : refImages;

                            // ── PASS 1: text-free panel art (provider per IMAGE_PROVIDER env) ──
                            send({
                                type: "panel-stage",
                                id: row.id,
                                ord: row.ord,
                                stage: "drawing",
                                attempt: attempt + 1,
                            });
                            const artResult = await generatePanelArt({
                                prompt,
                                referenceImages: refsForCall,
                                aspectRatio: "2:3",
                            });
                            base64 = artResult.base64;
                            artBase64 = artResult.base64;

                            // ── PASS 2: Nano Banana Pro adds Georgian text on top ──
                            // Only when this panel actually has dialogue / caption / title.
                            const needsText =
                                row.page_type === "cover" ||
                                (Array.isArray(scriptPanel.dialogue) && scriptPanel.dialogue.length > 0) ||
                                !!scriptPanel.caption;

                            // Surface the text-free art to the client so the
                            // user sees the first pass land before Nano Banana
                            // adds Georgian text on top. Skipped when there's
                            // no text to add (closing pages without dialogue).
                            if (needsText) {
                                send({
                                    type: "panel-art",
                                    id: row.id,
                                    ord: row.ord,
                                    image_data_url: `data:image/png;base64,${base64}`,
                                });
                            }
                            if (needsText) {
                                try {
                                    send({
                                        type: "panel-stage",
                                        id: row.id,
                                        ord: row.ord,
                                        stage: "writing",
                                    });
                                    const overlayPrompt = buildTextOverlayPrompt({
                                        pageType: row.page_type,
                                        dialogue: scriptPanel.dialogue,
                                        caption: scriptPanel.caption,
                                        title,
                                        subtitle,
                                        coverTypography: style.coverTypography,
                                        stylePrefix: style.promptPrefix,
                                    });
                                    const overlayResult = await generateImage({
                                        prompt: overlayPrompt,
                                        referenceImages: [
                                            { base64, mimeType: "image/png" },
                                        ],
                                        aspectRatio: "2:3",
                                    });
                                    base64 = overlayResult.base64;
                                } catch (e) {
                                    console.warn(
                                        `[generate] text overlay failed for panel ${row.ord}, keeping bare art:`,
                                        e.message
                                    );
                                }
                            }

                            // Critic pass
                            critique = await critiquePanel({
                                imageBase64: base64,
                                mimeType: "image/png",
                                pageType: row.page_type,
                                dialogue: scriptPanel.dialogue,
                                caption: scriptPanel.caption,
                                title: row.page_type === "cover" ? title : "",
                                characters: characters || [],
                            });

                            const needsRedo =
                                critique &&
                                (critique.overall === "needs_redo" ||
                                    (critique.score || 10) <= 5);

                            if (!needsRedo) {
                                if (attempt > 0) {
                                    console.log(
                                        `[generate] panel ${row.ord} fixed on retry attempt=${attempt + 1}, score=${critique?.score}`
                                    );
                                }
                                break;
                            }

                            console.log(
                                `[generate] panel ${row.ord} attempt=${attempt + 1}/${MAX_PANEL_ATTEMPTS} flagged by critic (score=${critique?.score}), retrying`
                            );
                            lastBadBase64 = base64;
                        }

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

                        // Also persist the text-free art so future regenerates
                        // that only need text fixes can re-overlay without
                        // re-running OpenAI. Different path from the final.
                        const artPath = path.replace(/\.png$/, ".art.png");
                        if (artBase64 && artBase64 !== base64) {
                            try {
                                await admin.storage
                                    .from(PANEL_BUCKET)
                                    .upload(artPath, Buffer.from(artBase64, "base64"), {
                                        contentType: "image/png",
                                        upsert: true,
                                    });
                            } catch (e) {
                                console.warn(
                                    `[generate] art-only upload failed for panel ${row.ord}:`,
                                    e.message
                                );
                            }
                        }

                        const { data: signed } = await admin.storage
                            .from(PANEL_BUCKET)
                            .createSignedUrl(path, 60 * 60 * 24 * 30);

                        await admin
                            .from("comic_panels")
                            .update({
                                status: "ready",
                                image_path: path,
                                image_url: signed.signedUrl,
                                critique,
                            })
                            .eq("id", row.id);

                        send({
                            type: "panel-ready",
                            id: row.id,
                            ord: row.ord,
                            image_url: signed.signedUrl,
                            critique,
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

                // Hard ceiling for a single panel's full pipeline (PASS 1 +
                // PASS 2 + critic + retry). Even if everything below times
                // out at its own layer, this guarantees a stuck panel can't
                // hold up the worker for more than 4 minutes.
                const PANEL_HARD_TIMEOUT_MS = 4 * 60_000;
                function withWorkerTimeout(row, scriptIdx) {
                    return new Promise((resolve) => {
                        let done = false;
                        const t = setTimeout(async () => {
                            if (done) return;
                            done = true;
                            console.warn(
                                `[generate] panel ${row.ord} hard-timeout after ${PANEL_HARD_TIMEOUT_MS / 1000}s, marking failed`
                            );
                            try {
                                await admin
                                    .from("comic_panels")
                                    .update({ status: "failed" })
                                    .eq("id", row.id);
                                send({
                                    type: "panel-failed",
                                    id: row.id,
                                    ord: row.ord,
                                    error: "panel hard-timeout",
                                });
                            } catch {}
                            resolve();
                        }, PANEL_HARD_TIMEOUT_MS);
                        generateOne(row, scriptIdx).finally(() => {
                            if (done) return;
                            done = true;
                            clearTimeout(t);
                            resolve();
                        });
                    });
                }

                async function worker(workerId) {
                    while (cursor < panelRows.length) {
                        const i = cursor++;
                        const row = panelRows[i];
                        console.log(
                            `[generate] worker=${workerId} starting panel ${row.ord} (${i + 1}/${panelRows.length})`
                        );
                        const t0 = Date.now();
                        await withWorkerTimeout(row, i);
                        console.log(
                            `[generate] worker=${workerId} done panel ${row.ord} in ${Date.now() - t0}ms`
                        );
                    }
                    console.log(`[generate] worker=${workerId} idle, cursor=${cursor}`);
                }

                await Promise.all(
                    Array.from(
                        { length: Math.min(CONCURRENCY, panelRows.length) },
                        (_, idx) => worker(idx + 1)
                    )
                );

                await admin
                    .from("comic_projects")
                    .update({ status: "preview" })
                    .eq("id", id);
                send({ type: "done" });
            } catch (err) {
                console.error("generation pipeline error:", err);
                // Reset status so the user can retry from /style or /generate.
                // Without this, status stays "generating" forever and every
                // subsequent /generate call sees "already running".
                try {
                    await admin
                        .from("comic_projects")
                        .update({ status: "styling" })
                        .eq("id", id);
                } catch {}
                send({ type: "error", message: err.message });
            } finally {
                try { controller.close(); } catch {}
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
