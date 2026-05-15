import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, MessageCircle, Users, Palette, Wand2, Eye, CreditCard } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";

const STEPS = [
    { id: "story", label: "ისტორია", icon: MessageCircle, statuses: ["draft", "interviewing"] },
    { id: "characters", label: "პერსონაჟები", icon: Users, statuses: ["characters"] },
    { id: "style", label: "სტილი", icon: Palette, statuses: ["styling"] },
    { id: "generate", label: "გენერაცია", icon: Wand2, statuses: ["generating"] },
    { id: "preview", label: "გადახედვა", icon: Eye, statuses: ["preview"] },
    { id: "checkout", label: "შეძენა", icon: CreditCard, statuses: ["paid", "fulfilled"] },
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
        <div className="font-sans bg-bg-light min-h-screen pt-28 sm:pt-32 pb-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between mb-2">
                    <Link href="/comic" className="text-xs text-text-mutted hover:text-primary">← ჩემი კომიქსები</Link>
                    <span className="text-xs text-text-mutted">{project.title}</span>
                </div>

                {/* Stepper */}
                <div className="bg-white rounded-2xl border border-rose-100 p-4 mb-8 overflow-x-auto">
                    <div className="flex items-center justify-between min-w-[600px] sm:min-w-0">
                        {STEPS.map((s, idx) => {
                            const Icon = s.icon;
                            const done = idx < currentIdx;
                            const active = idx === currentIdx;
                            return (
                                <div key={s.id} className="flex-1 flex items-center">
                                    <div className="flex flex-col items-center gap-1 min-w-fit">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                                done
                                                    ? "bg-green-100 text-green-600"
                                                    : active
                                                    ? "bg-primary text-white shadow-md"
                                                    : "bg-gray-50 text-gray-300"
                                            }`}
                                        >
                                            {done ? <Check size={18} /> : <Icon size={18} />}
                                        </div>
                                        <span
                                            className={`text-[10px] uppercase tracking-wider font-semibold ${
                                                active ? "text-primary" : "text-text-mutted"
                                            }`}
                                        >
                                            {s.label}
                                        </span>
                                    </div>
                                    {idx < STEPS.length - 1 && (
                                        <div
                                            className={`flex-1 h-0.5 mx-2 ${
                                                done ? "bg-green-200" : "bg-gray-100"
                                            }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
}
