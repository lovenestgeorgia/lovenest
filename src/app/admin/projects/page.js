import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ProjectsTable } from "@/app/admin/page";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
    const admin = getSupabaseAdmin();
    const { data: projects } = await admin
        .from("comic_projects")
        .select("id, title, status, paid_digital, paid_print, created_at")
        .order("created_at", { ascending: false })
        .limit(500);

    return (
        <div className="space-y-6">
            <h2 className="text-[11px] uppercase tracking-[0.28em] font-mono text-text-mutted/80">
                ყველა პროექტი · {(projects || []).length}
            </h2>
            <ProjectsTable projects={projects || []} />
        </div>
    );
}
