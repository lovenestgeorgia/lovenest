import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isDevUser } from "@/lib/comic/access";
import { UnlockPaywall } from "@/components/comic/UnlockPaywall";
import { PRICES, formatPrice } from "@/lib/comic/pricing";
import { Sparkles, Download, MessageCircle, Palette, Wand2 } from "lucide-react";

const FEATURES = [
    { icon: MessageCircle, label: "AI ჩატით ისტორიის ამოღება" },
    { icon: Wand2, label: "8-16 პერსონალური კადრის გენერაცია" },
    { icon: Palette, label: "6 ვიზუალური სტილი" },
    { icon: Download, label: "PDF ფორმატით ჩამოტვირთვა" },
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

    // Already paid OR dev/admin bypass — skip the paywall
    if (project.paid_digital || isDevUser(user)) {
        redirect(`/comic/${id}/story`);
    }

    return (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-8 md:p-12">
            <div className="text-center space-y-3 mb-10">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-rose-600 flex items-center justify-center text-white shadow-lg">
                    <Sparkles size={28} />
                </div>
                <h1 className="text-3xl md:text-4xl font-serif text-text-dark">
                    გახსენი შენი კომიქსი
                </h1>
                <p className="text-text-mutted max-w-md mx-auto">
                    ერთჯერადი {formatPrice(PRICES.digital)} გადახდის შემდეგ შეგიძლია შექმნა შენი უნიკალური კომიქსი
                    AI-ით და ჩამოტვირთო PDF ფორმატით.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 max-w-xl mx-auto">
                {FEATURES.map(({ icon: Icon, label }) => (
                    <div
                        key={label}
                        className="flex items-center gap-3 bg-rose-50/40 border border-rose-100 rounded-xl px-4 py-3"
                    >
                        <Icon size={18} className="text-primary shrink-0" />
                        <span className="text-sm text-text-dark">{label}</span>
                    </div>
                ))}
            </div>

            <div className="max-w-md mx-auto">
                <UnlockPaywall projectId={id} userEmail={user.email} />
                <p className="text-xs text-text-mutted text-center mt-4">
                    ბეჭდური წიგნი ცალკე იყიდება გენერაციის შემდეგ — +{formatPrice(PRICES.print)}.
                </p>
            </div>
        </div>
    );
}
