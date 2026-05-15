import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getGemini, TEXT_MODEL } from "@/lib/gemini";
import { PERSONA_FROM_IMAGE_PROMPT } from "@/lib/comic/prompts";
import { CHARACTER_BUCKET, characterPath } from "@/lib/comic/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req, { params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const { data: project } = await supabase
        .from("comic_projects")
        .select("id")
        .eq("id", id)
        .single();
    if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

    const form = await req.formData();
    const file = form.get("file");
    const name = (form.get("name") || "").toString().trim();
    const description = (form.get("description") || "").toString().trim();

    if (!file || !name) {
        return NextResponse.json({ error: "missing file or name" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
    const filename = `${crypto.randomUUID()}.${ext}`;
    const path = characterPath({ userId: user.id, projectId: id, filename });

    const admin = getSupabaseAdmin();
    const contentType = file.type || "image/jpeg";

    const { error: upErr } = await admin.storage
        .from(CHARACTER_BUCKET)
        .upload(path, bytes, { contentType, upsert: false });
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // Long-lived signed URL for UI display
    const { data: signed, error: signErr } = await admin.storage
        .from(CHARACTER_BUCKET)
        .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signErr) return NextResponse.json({ error: signErr.message }, { status: 500 });

    // Use Gemini multimodal vision to extract a detailed persona
    let persona = "";
    try {
        const client = getGemini();
        const result = await client.models.generateContent({
            model: TEXT_MODEL,
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
            },
        });
        persona = (result?.text || "").trim();
    } catch (e) {
        console.error("persona extraction failed:", e);
    }

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
