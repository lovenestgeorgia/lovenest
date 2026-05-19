import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PANEL_BUCKET } from "@/lib/comic/storage";
import { isDevUser } from "@/lib/comic/access";

// A run that hasn't made progress for this long is treated as dead. Vercel's
// max function duration is 5 min, so anything past ~7 min is definitely not
// still running. Keeps the regenerate-all button unblocked when the pipeline
// crashed before it could reset the project status.
const STALE_GENERATING_MS = 7 * 60 * 1000;

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
export async function DELETE(req, { params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const { data: project } = await supabase
        .from("comic_projects")
        .select("id, user_id, status, updated_at")
        .eq("id", id)
        .single();
    if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (project.user_id !== user.id) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Block delete-all while a generation run is genuinely in flight —
    // otherwise the in-flight pipeline keeps writing into deleted rows and
    // storage gets sprinkled with orphans. But: a crashed run leaves the
    // project stuck in "generating" forever, so we also check whether the
    // most recent panel update is older than STALE_GENERATING_MS. If so, the
    // pipeline is dead and we proceed. Admins can also force via ?force=1.
    if (project.status === "generating") {
        const force =
            new URL(req.url).searchParams.get("force") === "1" && isDevUser(user);

        let stale = false;
        if (!force) {
            const { data: latest } = await supabase
                .from("comic_panels")
                .select("updated_at")
                .eq("project_id", id)
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            const latestActivity = latest?.updated_at || project.updated_at;
            const ageMs = latestActivity
                ? Date.now() - new Date(latestActivity).getTime()
                : Infinity;
            stale = ageMs > STALE_GENERATING_MS;
            if (!stale) {
                const minutes = Math.max(1, Math.round(ageMs / 60_000));
                return NextResponse.json(
                    {
                        error: `generation in progress (last update ${minutes} min ago); wait until it finishes or fails`,
                    },
                    { status: 409 }
                );
            }
            console.warn(
                `[panels DELETE] project ${id} status=generating but stale ` +
                    `(no activity for ${Math.round(ageMs / 60_000)} min) — proceeding`
            );
        }
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
