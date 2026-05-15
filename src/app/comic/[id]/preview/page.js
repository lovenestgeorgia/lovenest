import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ensurePaidDigital, isDevUser } from "@/lib/comic/access";
import { PreviewPanels } from "@/components/comic/PreviewPanels";
import { RegenerateAllButton } from "@/components/comic/RegenerateAllButton";
import { Download, Truck } from "lucide-react";

export default async function PreviewPage({ params }) {
    const { id } = await params;
    await ensurePaidDigital(id);
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
            .select("id, ord, page_type, scene_prompt, caption, dialogue, actions, image_url, status")
            .eq("project_id", id)
            .order("ord", { ascending: true }),
    ]);

    if (!project) notFound();
    const devAccess = isDevUser(user);
    const hasDigital = project.paid_digital || devAccess;

    const allReady = (panels || []).length > 0 && panels.every((p) => p.status === "ready");

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 md:p-10">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-serif text-text-dark mb-1">გადახედე და დაასწორე</h1>
                        <p className="text-text-mutted text-sm">
                            ცვალე წარწერა, ან თუ კადრი არ მოგწონს — გადააგენერირე.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <RegenerateAllButton projectId={id} />
                        {project.paid_digital ? (
                            <Link href={`/comic/${id}/done`} className="elegant-btn inline-flex items-center gap-2">
                                <Download size={16} /> ჩამოტვირთვა
                            </Link>
                        ) : (
                            allReady && (
                                <Link href={`/comic/${id}/checkout`} className="elegant-btn inline-flex items-center gap-2">
                                    <Truck size={16} /> შეიძინე
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
            </div>
        </div>
    );
}
