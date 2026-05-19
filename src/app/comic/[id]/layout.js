import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { PaperGrain, StepRibbon } from "@/components/comic/StudioChrome";

const STEPS = [
    { id: "story", label: "ისტორია", statuses: ["draft", "interviewing"] },
    { id: "characters", label: "პერსონაჟები", statuses: ["characters"] },
    { id: "style", label: "სტილი", statuses: ["styling"] },
    { id: "generate", label: "გენერაცია", statuses: ["generating"] },
    { id: "preview", label: "გადახედვა", statuses: ["preview"] },
    { id: "checkout", label: "შეძენა", statuses: ["paid", "fulfilled"] },
];

function stepIndexFor(status) {
    return STEPS.findIndex((s) => s.statuses.includes(status));
}

export default async function ProjectLayout({ children, params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/auth/login?redirect=/comic/${id}/story`);

    const { data: project } = await supabase
        .from("comic_projects")
        .select("id, title, status")
        .eq("id", id)
        .single();

    if (!project) notFound();

    const currentIdx = Math.max(0, stepIndexFor(project.status));

    return (
        <div className="relative font-sans min-h-screen bg-bg-light pt-28 sm:pt-32 pb-24 overflow-hidden">
            {/* Ambient paper grain */}
            <PaperGrain className="fixed inset-0 z-0" />

            {/* Soft burgundy bloom in the upper corners */}
            <div
                aria-hidden
                className="fixed -top-32 -right-24 w-[480px] h-[480px] rounded-full pointer-events-none -z-0"
                style={{
                    background:
                        "radial-gradient(closest-side, oklch(70% 0.13 10 / 0.10), transparent 70%)",
                }}
            />
            <div
                aria-hidden
                className="fixed -top-24 -left-32 w-[420px] h-[420px] rounded-full pointer-events-none -z-0"
                style={{
                    background:
                        "radial-gradient(closest-side, oklch(85% 0.08 70 / 0.12), transparent 70%)",
                }}
            />

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
                {/* Utility bar */}
                <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.22em] font-medium mb-8">
                    <Link
                        href="/comic"
                        className="text-text-mutted/70 hover:text-primary transition-colors inline-flex items-center gap-1.5"
                    >
                        <span aria-hidden>←</span> ჩემი კომიქსები
                    </Link>
                    <span className="text-text-mutted/60 truncate max-w-[60%] text-right">
                        {project.title}
                    </span>
                </div>

                {/* Step ribbon */}
                <StepRibbon steps={STEPS} currentIdx={currentIdx} />

                {/* Page content */}
                <main className="mt-12 sm:mt-16">{children}</main>
            </div>
        </div>
    );
}
