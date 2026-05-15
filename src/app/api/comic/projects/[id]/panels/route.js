import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PANEL_BUCKET } from "@/lib/comic/storage";

export async function GET(_req, { params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
        .from("comic_panels")
        .select("id, ord, scene_prompt, caption, image_url, status, revision_count")
        .eq("project_id", id)
        .order("ord", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ panels: data });
}

// Wipes all panels (rows + storage objects) for a project so the generation
// pipeline can run again from scratch. Used by the "regenerate all" button.
export async function DELETE(_req, { params }) {
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

    const admin = getSupabaseAdmin();

    // Collect storage paths so we can clean up the objects too
    const { data: existing } = await supabase
        .from("comic_panels")
        .select("image_path")
        .eq("project_id", id);

    const paths = (existing || []).map((p) => p.image_path).filter(Boolean);
    if (paths.length > 0) {
        await admin.storage.from(PANEL_BUCKET).remove(paths);
    }

    await admin.from("comic_panels").delete().eq("project_id", id);
    await admin
        .from("comic_projects")
        .update({ status: "generating" })
        .eq("id", id);

    return NextResponse.json({ ok: true });
}
