import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function PATCH(req, { params }) {
    const { id, panelId } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const body = await req.json();
    const patch = {};
    if (typeof body.caption === "string") patch.caption = body.caption.slice(0, 300);
    if (typeof body.scene_prompt === "string") patch.scene_prompt = body.scene_prompt.slice(0, 2000);

    const { data, error } = await supabase
        .from("comic_panels")
        .update(patch)
        .eq("id", panelId)
        .eq("project_id", id)
        .select("*")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ panel: data });
}
