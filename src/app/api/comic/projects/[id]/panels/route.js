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
        .select("id, user_id, status")
        .eq("id", id)
        .single();
    if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (project.user_id !== user.id) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Block delete-all while a generation run is in flight — otherwise the
    // in-flight pipeline keeps writing into deleted rows and storage gets
    // sprinkled with orphans.
    if (project.status === "generating") {
        return NextResponse.json(
            { error: "generation in progress; wait until it finishes or fails" },
            { status: 409 }
        );
    }

    const admin = getSupabaseAdmin();

    const { data: existing } = await supabase
        .from("comic_panels")
        .select("image_path")
        .eq("project_id", id);

    const paths = (existing || []).map((p) => p.image_path).filter(Boolean);
    if (paths.length > 0) {
        await admin.storage.from(PANEL_BUCKET).remove(paths);
    }

    await admin.from("comic_panels").delete().eq("project_id", id);
    // Reset back to "styling" — the next /generate POST will atomically claim
    // and re-enter "generating" state.
    await admin
        .from("comic_projects")
        .update({ status: "styling" })
        .eq("id", id);

    return NextResponse.json({ ok: true });
}
