import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensurePaidDigital } from "@/lib/comic/access";
import { GenerationProgress } from "@/components/comic/GenerationProgress";
import { StudioSheet } from "@/components/comic/StudioChrome";

export default async function GenerateStepPage({ params }) {
    const { id } = await params;
    // ensurePaidDigital allows backward navigation; the "styling → generate"
    // entry case is handled inside the helper.
    await ensurePaidDigital(id, "generate");

    // Hard precondition: can't generate without characters. If the project has
    // zero, bounce back to the characters step instead of erroring out in the
    // API and showing a recovery modal. Admin client to dodge RLS edge cases.
    const admin = getSupabaseAdmin();
    const { count: charCount } = await admin
        .from("comic_characters")
        .select("id", { count: "exact", head: true })
        .eq("project_id", id);
    if ((charCount || 0) === 0) {
        redirect(`/comic/${id}/characters`);
    }

    const supabase = await getSupabaseServer();

    const [{ data: project }, { data: panels }] = await Promise.all([
        supabase
            .from("comic_projects")
            .select("id, status, panel_count, style_id")
            .eq("id", id)
            .single(),
        supabase
            .from("comic_panels")
            .select("id, ord, page_type, caption, image_url, status")
            .eq("project_id", id)
            .order("ord", { ascending: true }),
    ]);

    if (!project) notFound();

    return (
        <StudioSheet className="p-4 sm:p-6 md:p-8 overflow-hidden">
            <GenerationProgress
                projectId={project.id}
                expectedCount={project.panel_count}
                initialPanels={panels || []}
                shouldStart={(panels || []).length === 0}
            />
        </StudioSheet>
    );
}
