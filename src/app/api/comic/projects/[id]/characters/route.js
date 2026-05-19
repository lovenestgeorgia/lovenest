import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateTextWithFallback } from "@/lib/gemini";
import { PERSONA_FROM_IMAGE_PROMPT } from "@/lib/comic/prompts";
import { CHARACTER_BUCKET, characterPath } from "@/lib/comic/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

// Validation for character upload — block giant files and non-image MIME types
// that would crash the Gemini vision call or blow up serverless memory.
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_CHARS_PER_PROJECT = 8;

export async function POST(req, { params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    // Owner check — RLS already scopes the SELECT, but we read user_id so the
    // later admin-client writes don't silently land under a different project.
    const { data: project } = await supabase
        .from("comic_projects")
        .select("id, user_id")
        .eq("id", id)
        .single();
    if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (project.user_id !== user.id) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Cap how many characters can be uploaded per project to bound cost
    const { count } = await supabase
        .from("comic_characters")
        .select("id", { count: "exact", head: true })
        .eq("project_id", id);
    if ((count || 0) >= MAX_CHARS_PER_PROJECT) {
        return NextResponse.json(
            { error: `max ${MAX_CHARS_PER_PROJECT} characters per project` },
            { status: 429 }
        );
    }

    const form = await req.formData();
    const file = form.get("file");
    const name = (form.get("name") || "").toString().trim().slice(0, 60);
    const description = (form.get("description") || "").toString().trim().slice(0, 400);

    if (!file || !name) {
        return NextResponse.json({ error: "missing file or name" }, { status: 400 });
    }

    const contentType = file.type || "image/jpeg";
    if (!ALLOWED_MIME.has(contentType)) {
        return NextResponse.json(
            { error: "unsupported image type (use JPEG, PNG, or WebP)" },
            { status: 400 }
        );
    }
    if (typeof file.size === "number" && file.size > MAX_BYTES) {
        return NextResponse.json(
            { error: "image too large (max 8 MB)" },
            { status: 413 }
        );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) {
        return NextResponse.json(
            { error: "image too large (max 8 MB)" },
            { status: 413 }
        );
    }

    // Run face quality check + persona extraction in a SINGLE Gemini call,
    // BEFORE we touch storage. If the face check fails, we return immediately
    // without uploading anything — keeps storage clean and saves the user
    // a second confusing "your character looks weird" failure downstream.
    let persona = "";
    try {
        const result = await generateTextWithFallback({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `Customer's caption for this person: "${description || name}"`,
                        },
                        {
                            inlineData: {
                                mimeType: contentType,
                                data: bytes.toString("base64"),
                            },
                        },
                    ],
                },
            ],
            config: {
                systemInstruction: PERSONA_FROM_IMAGE_PROMPT,
                responseMimeType: "application/json",
            },
        });
        const parsed = JSON.parse((result?.text || "{}").trim());

        if (!parsed.has_clear_face) {
            return NextResponse.json(
                {
                    error: "face_quality",
                    issue: parsed.issue || "no_face",
                },
                { status: 400 }
            );
        }
        persona = (parsed.persona || "").trim();
    } catch (e) {
        console.error("face check / persona extraction failed:", e);
        const msg = String(e?.message || e || "");
        // Detect transient AI service errors so the client can show a "try again"
        // explanation instead of silently uploading a persona-less character.
        const isTransient =
            /\b(429|500|502|503|504)\b/.test(msg) ||
            /UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|deadline/i.test(msg);
        return NextResponse.json(
            {
                error: isTransient ? "ai_unavailable" : "ai_failed",
                detail: msg.slice(0, 300),
            },
            { status: isTransient ? 503 : 500 }
        );
    }

    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = characterPath({ userId: user.id, projectId: id, filename });

    const admin = getSupabaseAdmin();

    const { error: upErr } = await admin.storage
        .from(CHARACTER_BUCKET)
        .upload(path, bytes, { contentType, upsert: false });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // Long-lived signed URL for UI display.
    const { data: signed, error: signErr } = await admin.storage
        .from(CHARACTER_BUCKET)
        .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signErr) return NextResponse.json({ error: signErr.message }, { status: 500 });

    const { data: character, error: insErr } = await supabase
        .from("comic_characters")
        .insert({
            project_id: id,
            name,
            description,
            persona,
            reference_image_url: signed.signedUrl,
            reference_image_path: path,
        })
        .select("*")
        .single();

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

    await supabase
        .from("comic_projects")
        .update({ status: "characters" })
        .eq("id", id)
        .in("status", ["draft", "interviewing"]);

    return NextResponse.json({ character });
}

export async function GET(_req, { params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
        .from("comic_characters")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ characters: data });
}
