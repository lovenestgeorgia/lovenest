import Link from "next/link";
import Image from "next/image";
import { Sparkles, BookHeart, Palette, Wand2, Download, Truck, Plus } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { COMIC_STYLES } from "@/lib/comic/styles";
import { PRICES, formatPrice } from "@/lib/comic/pricing";
import { NewProjectButton } from "@/components/comic/NewProjectButton";

export const metadata = {
    title: "AI კომიქსის გენერატორი | Lovenest",
    description: "შეუთხრე შენი ისტორია, ჩვენ მას კომიქსად აქცევთ. AI-ით გენერირებული პერსონალური კომიქსი.",
};

const STEPS = [
    { icon: BookHeart, title: "გვიამბე შენი ისტორია", desc: "ჩვენი AI გკითხავს კითხვებს და დაგეხმარება დეტალების ამოღებაში." },
    { icon: Sparkles, title: "ატვირთე ფოტოები", desc: "მონიშნე ვინ არის თითო ფოტოზე — გავარჩევთ და დავიმახსოვრებთ." },
    { icon: Palette, title: "აირჩიე სტილი", desc: "6 სხვადასხვა ვიზუალური სტილიდან აირჩიე ისეთი, რომელიც გრძნობას უხდება." },
    { icon: Wand2, title: "ჩვენ ვხატავთ", desc: "AI ხატავს თითო კადრს თქვენი პერსონაჟებით და სცენებით." },
];

export default async function ComicLandingPage() {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    let projects = [];
    if (user) {
        const { data } = await supabase
            .from("comic_projects")
            .select("id, title, status, created_at, style_id, paid_digital")
            .order("created_at", { ascending: false })
            .limit(20);
        projects = data || [];
    }

    return (
        <div className="font-sans bg-bg-light relative overflow-hidden min-h-screen">
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-rose-300/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-10 pt-28 sm:pt-36 pb-24">
                {/* Hero */}
                <section className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 rounded-full text-primary font-medium text-xs border border-rose-100">
                            <Sparkles size={12} /> ახალი ფუნქცია
                        </span>
                        <h1 className="text-5xl md:text-6xl font-serif text-text-dark leading-[1.05]">
                            შენი ისტორია — <span className="text-primary italic">კომიქსად</span>
                        </h1>
                        <p className="text-lg text-text-mutted leading-relaxed">
                            გვიამბე ისტორია, ატვირთე ფოტოები ვინც მონაწილეობს, აირჩიე სტილი —
                            AI შენთვის შექმნის უნიკალურ კომიქსს, რომელსაც ციფრულად ჩამოტვირთავ ან დაიბეჭდავ.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            {user ? (
                                <NewProjectButton className="elegant-btn text-lg group">
                                    <Plus size={20} /> ახალი კომიქსი
                                </NewProjectButton>
                            ) : (
                                <Link href="/auth/register?redirect=/comic" className="elegant-btn text-lg group">
                                    დაიწყე უფასოდ <Sparkles size={18} className="ml-2 group-hover:rotate-12 transition-transform" />
                                </Link>
                            )}
                            <Link href="#how" className="elegant-btn-outline text-lg">
                                როგორ მუშაობს
                            </Link>
                        </div>

                        <div className="flex flex-wrap gap-6 text-sm text-text-mutted pt-4">
                            <span className="flex items-center gap-1.5"><Download size={14} /> ციფრული {formatPrice(PRICES.digital)}</span>
                            <span className="flex items-center gap-1.5"><Truck size={14} /> ბეჭდური +{formatPrice(PRICES.print)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {COMIC_STYLES.slice(0, 4).map((s) => (
                            <div
                                key={s.id}
                                className="aspect-[3/4] rounded-2xl overflow-hidden border border-rose-100 shadow-md bg-rose-50/40 relative"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={s.sample}
                                    alt={s.nameGe}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 z-10">
                                    <p className="text-white text-xs font-bold">{s.nameGe}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Existing projects */}
                {user && projects.length > 0 && (
                    <section className="max-w-6xl mx-auto px-6 mt-20">
                        <h2 className="text-2xl font-serif text-text-dark mb-6">ჩემი კომიქსები</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((p) => (
                                <Link
                                    key={p.id}
                                    href={resumeHref(p)}
                                    className="bg-white rounded-2xl border border-rose-100 p-6 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-serif text-lg text-text-dark truncate">{p.title}</h3>
                                        <StatusBadge status={p.status} />
                                    </div>
                                    <p className="text-xs text-text-mutted">
                                        {new Date(p.created_at).toLocaleDateString("ka-GE")}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* How it works */}
                <section id="how" className="max-w-5xl mx-auto px-6 mt-32">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl md:text-5xl font-serif text-text-dark">როგორ მუშაობს</h2>
                        <p className="text-text-mutted">4 მარტივი ნაბიჯი, 5 წუთში</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {STEPS.map(({ icon: Icon, title, desc }, idx) => (
                            <div key={idx} className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-rose-50 text-primary flex items-center justify-center mb-4">
                                    <Icon size={24} />
                                </div>
                                <h3 className="font-serif font-bold text-text-dark mb-2">{idx + 1}. {title}</h3>
                                <p className="text-sm text-text-mutted leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Style showcase */}
                <section className="max-w-6xl mx-auto px-6 mt-32">
                    <div className="text-center mb-12 space-y-4">
                        <h2 className="text-4xl font-serif text-text-dark">აირჩიე სტილი</h2>
                        <p className="text-text-mutted">6 უნიკალური ვიზუალური ხელწერა</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {COMIC_STYLES.map((s) => (
                            <div key={s.id} className="bg-white rounded-2xl border border-rose-100 p-4 shadow-sm">
                                <div className="aspect-[3/4] rounded-xl overflow-hidden mb-3 relative bg-gradient-to-br from-rose-50 to-amber-50">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={s.sample}
                                        alt={s.name}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="font-serif font-bold text-text-dark text-sm">{s.nameGe}</h3>
                                <p className="text-xs text-text-mutted mt-1">{s.taglineGe}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="max-w-3xl mx-auto px-6 mt-32 text-center space-y-8">
                    <h2 className="text-4xl md:text-5xl font-serif text-text-dark">მზად ხარ?</h2>
                    <p className="text-text-mutted text-lg">
                        ჩვენი AI მზადაა შენი ისტორიის მოსასმენად.
                    </p>
                    {user ? (
                        <NewProjectButton className="elegant-btn text-lg">
                            <Plus size={20} /> ახალი კომიქსი
                        </NewProjectButton>
                    ) : (
                        <Link href="/auth/register?redirect=/comic" className="elegant-btn text-lg inline-flex">
                            დაიწყე უფასოდ <Sparkles size={18} className="ml-2" />
                        </Link>
                    )}
                </section>
            </main>
        </div>
    );
}

function resumeHref(p) {
    if (!p.paid_digital) return `/comic/${p.id}/unlock`;
    switch (p.status) {
        case "draft":
        case "interviewing":
            return `/comic/${p.id}/story`;
        case "characters":
            return `/comic/${p.id}/characters`;
        case "styling":
            return `/comic/${p.id}/style`;
        case "generating":
            return `/comic/${p.id}/generate`;
        case "preview":
        case "paid":
        case "fulfilled":
            return `/comic/${p.id}/preview`;
        default:
            return `/comic/${p.id}/story`;
    }
}

function StatusBadge({ status }) {
    const map = {
        draft: { label: "მონახაზი", cls: "bg-gray-100 text-gray-600" },
        interviewing: { label: "ისტორია", cls: "bg-blue-50 text-blue-600" },
        characters: { label: "პერსონაჟები", cls: "bg-purple-50 text-purple-600" },
        styling: { label: "სტილი", cls: "bg-amber-50 text-amber-600" },
        generating: { label: "იხატება...", cls: "bg-yellow-50 text-yellow-700" },
        preview: { label: "მზადაა", cls: "bg-green-50 text-green-600" },
        paid: { label: "გადახდილია", cls: "bg-emerald-50 text-emerald-700" },
        fulfilled: { label: "მიწოდებული", cls: "bg-emerald-50 text-emerald-700" },
    };
    const v = map[status] || map.draft;
    return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${v.cls}`}>{v.label}</span>;
}
