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

const ALLOWED = new Set(["title", "story_text", "style_id", "panel_count", "status"]);

export async function PATCH(req, { params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const body = await req.json();
    const patch = {};
    for (const k of Object.keys(body)) {
        if (ALLOWED.has(k)) patch[k] = body[k];
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
