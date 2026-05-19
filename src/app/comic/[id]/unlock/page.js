import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isDevUser } from "@/lib/comic/access";
import { UnlockPaywall } from "@/components/comic/UnlockPaywall";
import { PRICES, formatPrice } from "@/lib/comic/pricing";
import { StudioSheet } from "@/components/comic/StudioChrome";
import { MessageCircle, Wand2, Palette, Download, Truck } from "lucide-react";

const FEATURES = [
    { num: "01", icon: MessageCircle, label: "AI ჩატით ისტორიის ამოღება" },
    { num: "02", icon: Wand2, label: "8-16 პერსონალური კადრის გენერაცია" },
    { num: "03", icon: Palette, label: "6 ვიზუალური სტილი" },
    { num: "04", icon: Download, label: "PDF ფორმატით ჩამოტვირთვა" },
    { num: "05", icon: Truck, label: "ბეჭდური წიგნი მისამართზე მიწოდებით" },
];

export default async function UnlockPage({ params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/auth/login?redirect=/comic/${id}/unlock`);

    const { data: project } = await supabase
        .from("comic_projects")
        .select("id, title, paid_digital")
        .eq("id", id)
        .single();
    if (!project) notFound();

    if (project.paid_digital || isDevUser(user)) {
        redirect(`/comic/${id}/story`);
    }

    return (
        <StudioSheet className="p-8 sm:p-12">
            <header className="text-center max-w-xl mx-auto mb-12">
                <p className="text-[10px] uppercase tracking-[0.28em] text-text-mutted/70 font-mono mb-4">
                    შეკვეთა · {formatPrice(PRICES.digital)}
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl text-text-dark leading-[1.05] tracking-tight">
                    შეუკვეთე შენი <span className="italic text-primary">კომიქსი</span>
                </h1>
                <p className="text-text-mutted mt-4 leading-relaxed">
                    {formatPrice(PRICES.digital)} მოიცავს ყველაფერს: AI-ის მიერ შექმნილ კომიქსს,
                    PDF ფორმატით ჩამოტვირთვას და ბეჭდურ წიგნს მისამართზე მიწოდებით.
                </p>
            </header>

            {/* Feature list — number + icon + label, separated by hairlines */}
            <ul className="max-w-md mx-auto mb-10 divide-y divide-rose-100/60 border-y border-rose-100/60">
                {FEATURES.map(({ num, icon: Icon, label }) => (
                    <li
                        key={num}
                        className="flex items-center gap-5 py-4 text-sm text-text-dark"
                    >
                        <span className="font-mono text-[11px] text-primary/70 tabular-nums shrink-0 w-5">
                            {num}
                        </span>
                        <span className="w-9 h-9 rounded-full bg-rose-50 text-primary flex items-center justify-center shrink-0">
                            <Icon size={16} />
                        </span>
                        <span>{label}</span>
                    </li>
                ))}
            </ul>

            <div className="max-w-md mx-auto">
                <UnlockPaywall projectId={id} userEmail={user.email} />
                <p className="text-[11px] uppercase tracking-[0.22em] text-text-mutted/60 font-medium text-center mt-5">
                    უფასო შეფუთვა · მიწოდება 2-5 დღეში
                </p>
            </div>
        </StudioSheet>
    );
}
