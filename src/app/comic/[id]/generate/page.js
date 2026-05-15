import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ensurePaidDigital } from "@/lib/comic/access";
import { GenerationProgress } from "@/components/comic/GenerationProgress";
import { RegenerateAllButton } from "@/components/comic/RegenerateAllButton";

export default async function GenerateStepPage({ params }) {
    const { id } = await params;
    await ensurePaidDigital(id);
    const supabase = await getSupabaseServer();

    const [{ data: project }, { data: panels }] = await Promise.all([
        supabase.from("comic_projects").select("id, status, panel_count, style_id").eq("id", id).single(),
        supabase
            .from("comic_panels")
            .select("id, ord, caption, image_url, status")
            .eq("project_id", id)
            .order("ord", { ascending: true }),
    ]);

    if (!project) notFound();

    return (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 md:p-10">
            <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-serif text-text-dark mb-2">ვხატავთ შენს კომიქსს</h1>
                    <p className="text-text-mutted text-sm">
                        ეს 2-5 წუთს გასტანს. შეგიძლია ფანჯარა ღია დატოვო ან მოგვიანებით დაბრუნდე —
                        გენერაცია ფონურად გაგრძელდება.
                    </p>
                </div>
                <RegenerateAllButton projectId={id} />
            </div>

            <GenerationProgress
                projectId={project.id}
                expectedCount={project.panel_count}
                initialPanels={panels || []}
                shouldStart={(panels || []).length === 0}
            />
        </div>
    );
}
