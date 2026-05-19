import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { ensurePaidDigital } from "@/lib/comic/access";
import { COMIC_STYLES } from "@/lib/comic/styles";
import { StylePicker } from "@/components/comic/StylePicker";
import { StudioSheet, StudioHeading } from "@/components/comic/StudioChrome";

export default async function StyleStepPage({ params }) {
    const { id } = await params;
    await ensurePaidDigital(id, "style");

    // Same precondition as /generate — without characters, the style choice
    // is meaningless. Bounce back to the characters step.
    const admin = getSupabaseAdmin();
    const { count: charCount } = await admin
        .from("comic_characters")
        .select("id", { count: "exact", head: true })
        .eq("project_id", id);
    if ((charCount || 0) === 0) {
        redirect(`/comic/${id}/characters`);
    }

    const supabase = await getSupabaseServer();
    const { data: project } = await supabase
        .from("comic_projects")
        .select("id, style_id, panel_count")
        .eq("id", id)
        .single();

    if (!project) notFound();

    return (
        <StudioSheet className="p-6 sm:p-10">
            <StudioHeading eyebrow="03 — სტილი" accent="ვიზუალური სტილი">
                აირჩიე
            </StudioHeading>
            <p className="text-center text-sm text-text-mutted max-w-md mx-auto mt-3 mb-10 leading-relaxed">
                ეს განსაზღვრავს მთელი კომიქსის ხელწერას. ყველა კადრი ერთსა და იმავე სტილში დაიხატება.
            </p>

            <StylePicker
                projectId={project.id}
                styles={COMIC_STYLES}
                initialStyleId={project.style_id}
                initialPanelCount={project.panel_count}
            />
        </StudioSheet>
    );
}
