import { getSupabaseServer } from "@/lib/supabase/server";
import { getGemini, TEXT_MODEL, toGeminiContents } from "@/lib/gemini";
import { INTERVIEW_SYSTEM_PROMPT } from "@/lib/comic/prompts";

export const runtime = "nodejs";

export async function POST(req, { params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("unauthenticated", { status: 401 });

    const { message, story } = await req.json();

    // Verify ownership
    const { data: project, error: projErr } = await supabase
        .from("comic_projects")
        .select("id")
        .eq("id", id)
        .single();
    if (projErr || !project) return new Response("not found", { status: 404 });

    // Persist the user message
    await supabase.from("comic_messages").insert({
        project_id: id,
        role: "user",
        content: message,
    });

    // Load full history
    const { data: history } = await supabase
        .from("comic_messages")
        .select("role, content")
        .eq("project_id", id)
        .order("created_at", { ascending: true });

    const systemInstruction = [
        INTERVIEW_SYSTEM_PROMPT,
        story ? `Story draft so far: ${story}` : null,
    ]
        .filter(Boolean)
        .join("\n\n");

    const contents = toGeminiContents(history || []);

    const client = getGemini();
    const stream = await client.models.generateContentStream({
        model: TEXT_MODEL,
        contents,
        config: { systemInstruction },
    });

    const encoder = new TextEncoder();
    let full = "";

    const body = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of stream) {
                    const token = chunk?.text;
                    if (token) {
                        full += token;
                        controller.enqueue(encoder.encode(token));
                    }
                }
            } catch (err) {
                controller.enqueue(encoder.encode(`\n(stream error: ${err.message})`));
            } finally {
                if (full) {
                    await supabase.from("comic_messages").insert({
                        project_id: id,
                        role: "assistant",
                        content: full,
                    });
                    const m = full.match(/READY_TO_GENERATE:\s*([\s\S]+)/);
                    if (m) {
                        await supabase
                            .from("comic_projects")
                            .update({ story_text: m[1].trim() })
                            .eq("id", id);
                    }
                }
                controller.close();
            }
        },
    });

    return new Response(body, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    });
}
