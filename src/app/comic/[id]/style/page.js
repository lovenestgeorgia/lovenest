import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ensurePaidDigital } from "@/lib/comic/access";
import { COMIC_STYLES } from "@/lib/comic/styles";
import { StylePicker } from "@/components/comic/StylePicker";

export default async function StyleStepPage({ params }) {
    const { id } = await params;
    await ensurePaidDigital(id);
    const supabase = await getSupabaseServer();
    const { data: project } = await supabase
        .from("comic_projects")
        .select("id, style_id, panel_count")
        .eq("id", id)
        .single();

    if (!project) notFound();

    return (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 md:p-10">
            <div className="mb-8">
                <h1 className="text-3xl font-serif text-text-dark mb-2">აირჩიე ვიზუალური სტილი</h1>
                <p className="text-text-mutted text-sm">
                    ეს განსაზღვრავს როგორ გამოიყურება შენი მთელი კომიქსი. ყველა კადრი ერთსა და იმავე სტილში დაიხატება.
                </p>
            </div>

            <StylePicker
                projectId={project.id}
                styles={COMIC_STYLES}
                initialStyleId={project.style_id}
                initialPanelCount={project.panel_count}
            />
        </div>
    );
}
