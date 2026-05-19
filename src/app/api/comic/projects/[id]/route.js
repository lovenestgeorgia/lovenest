import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(_req, { params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const { data, error } = await supabase
        .from("comic_projects")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ project: data });
}

// Fields the client may freely edit. NOTE: `status`, `paid_digital`, `paid_print`,
// `subtitle`, and `user_id` are server-managed and must NEVER be in this list —
// allowing client writes to them would let users skip the paywall, get free
// re-rolls, or hijack projects. `style_id` is mutable only while the project
// is in an early state (see PATCH below).
const ALWAYS_ALLOWED = new Set(["title", "story_text", "panel_count"]);
const EARLY_STATES = new Set(["draft", "interviewing", "characters", "styling"]);

export async function PATCH(req, { params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const body = await req.json();

    // Load current project so we can decide whether style_id is still editable
    const { data: current, error: loadErr } = await supabase
        .from("comic_projects")
        .select("status")
        .eq("id", id)
        .single();
    if (loadErr || !current) {
        return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const allowed = new Set(ALWAYS_ALLOWED);
    if (EARLY_STATES.has(current.status)) {
        allowed.add("style_id");
    }

    const patch = {};
    for (const k of Object.keys(body)) {
        if (allowed.has(k)) patch[k] = body[k];
    }

    // Status transitions: clients may only advance forward through the early states.
    // Server-side flows manage every later transition (generating → preview → paid).
    if (typeof body.status === "string" && EARLY_STATES.has(current.status) && EARLY_STATES.has(body.status)) {
        patch.status = body.status;
    }

    const { data, error } = await supabase
        .from("comic_projects")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ project: data });
}
