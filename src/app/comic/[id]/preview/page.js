import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ensurePaidDigital, isDevUser } from "@/lib/comic/access";
import { PreviewPanels } from "@/components/comic/PreviewPanels";
import { RegenerateAllButton } from "@/components/comic/RegenerateAllButton";
import { StudioSheet, StudioHeading } from "@/components/comic/StudioChrome";
import { Download, Truck, ArrowRight } from "lucide-react";

export default async function PreviewPage({ params }) {
    const { id } = await params;
    await ensurePaidDigital(id, "preview");
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    const [{ data: project }, { data: panels }] = await Promise.all([
        supabase
            .from("comic_projects")
            .select("id, title, subtitle, status, paid_digital, paid_print")
            .eq("id", id)
            .single(),
        supabase
            .from("comic_panels")
            .select("id, ord, page_type, scene_prompt, caption, dialogue, actions, image_url, status, critique")
            .eq("project_id", id)
            .order("ord", { ascending: true }),
    ]);

    if (!project) notFound();
    const devAccess = isDevUser(user);
    const hasDigital = project.paid_digital || devAccess;
    const allReady = (panels || []).length > 0 && panels.every((p) => p.status === "ready");
    const readyCount = (panels || []).filter((p) => p.status === "ready").length;

    return (
        <StudioSheet className="p-6 sm:p-10">
            <header className="text-center max-w-2xl mx-auto mb-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-text-mutted/70 font-mono mb-3">
                    05 — გადახედვა
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl text-text-dark leading-[1.05] tracking-tight">
                    {project.title || "შენი კომიქსი"}
                </h1>
                {project.subtitle && (
                    <p className="font-serif italic text-text-mutted text-lg mt-2">
                        {project.subtitle}
                    </p>
                )}
            </header>

            <p className="text-center text-sm text-text-mutted mb-8 max-w-md mx-auto leading-relaxed">
                გადახედე ყველა კადრს. ცვალე წარწერა, ან გადახატე ცალკეული კადრი თუ რამე არ მოგწონს.
            </p>

            {/* Slim action bar */}
            <div className="flex items-center justify-between gap-3 flex-wrap pb-6 mb-8 border-b border-rose-100/60">
                <div className="text-[11px] uppercase tracking-[0.22em] text-text-mutted/70 font-mono">
                    {readyCount.toString().padStart(2, "0")} / {(panels || []).length.toString().padStart(2, "0")} მზადაა
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <RegenerateAllButton projectId={id} />
                    {hasDigital ? (
                        <Link
                            href={`/comic/${id}/done`}
                            className="elegant-btn inline-flex items-center gap-2"
                        >
                            <Download size={16} /> ჩამოტვირთვა
                        </Link>
                    ) : (
                        allReady && (
                            <Link
                                href={`/comic/${id}/checkout`}
                                className="elegant-btn inline-flex items-center gap-2"
                            >
                                <Truck size={16} /> ბეჭდური წიგნი <ArrowRight size={14} />
                            </Link>
                        )
                    )}
                </div>
            </div>

            <PreviewPanels
                projectId={project.id}
                initialPanels={panels || []}
                watermark={!hasDigital && !project.paid_print}
            />
        </StudioSheet>
    );
}
