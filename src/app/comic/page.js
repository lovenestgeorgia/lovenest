import Link from "next/link";
import { Sparkles, Plus, ArrowRight, MessageCircle, Upload, Palette, Wand2 } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase/server";
import { COMIC_STYLES } from "@/lib/comic/styles";
import {
    PRICES,
    formatPrice,
    HAS_DIGITAL_DISCOUNT,
    DIGITAL_DISCOUNT_PERCENT,
} from "@/lib/comic/pricing";
import { NewProjectButton } from "@/components/comic/NewProjectButton";
import { PaperGrain } from "@/components/comic/StudioChrome";

export const metadata = {
    title: "AI კომიქსის გენერატორი | Lovenest",
    description:
        "შეუთხრე შენი ისტორია, ჩვენ მას კომიქსად აქცევთ. AI-ით გენერირებული პერსონალური კომიქსი.",
};

const STEPS = [
    { num: "01", icon: MessageCircle, title: "გვიამბე ისტორია", desc: "AI გკითხავს და დაგეხმარება დეტალების ამოღებაში." },
    { num: "02", icon: Upload, title: "ატვირთე ფოტოები", desc: "მონიშნე ვინ არის თითო ფოტოზე — ჩვენ დავიმახსოვრებთ." },
    { num: "03", icon: Palette, title: "აირჩიე სტილი", desc: "6 ვიზუალური სტილიდან აირჩიე ისეთი, რომელიც გრძნობას უხდება." },
    { num: "04", icon: Wand2, title: "AI ხატავს", desc: "თითო კადრი იხატება შენი პერსონაჟებითა და სცენებით." },
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
        <div className="font-sans bg-bg-light relative min-h-screen overflow-hidden">
            <PaperGrain className="fixed inset-0 z-0" />

            {/* Soft warmth blooms */}
            <div
                aria-hidden
                className="fixed -top-24 right-[-15%] w-[640px] h-[640px] rounded-full pointer-events-none z-0"
                style={{
                    background:
                        "radial-gradient(closest-side, oklch(70% 0.13 10 / 0.08), transparent 70%)",
                }}
            />
            <div
                aria-hidden
                className="fixed bottom-[-20%] left-[-20%] w-[720px] h-[720px] rounded-full pointer-events-none z-0"
                style={{
                    background:
                        "radial-gradient(closest-side, oklch(85% 0.08 70 / 0.10), transparent 70%)",
                }}
            />

            <main className="relative z-10 pt-28 sm:pt-36 pb-32">
                {/* Hero */}
                <section className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-16 lg:gap-20 items-center">
                    <div className="space-y-7">
                        <p className="text-[11px] uppercase tracking-[0.28em] font-mono text-primary inline-flex items-center gap-2">
                            <Sparkles size={11} /> ახალი — AI კომიქსი
                        </p>
                        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl text-text-dark leading-[0.95] tracking-tight">
                            შენი ისტორია —
                            <br />
                            <span className="italic text-primary">კომიქსად</span>
                        </h1>
                        <p className="text-lg text-text-mutted leading-relaxed max-w-lg">
                            გვიამბე ისტორია. ატვირთე იმათი ფოტოები ვინც მონაწილეობს. აირჩიე სტილი.
                            AI შენთვის შექმნის უნიკალურ კომიქსს — ციფრულად ან ბეჭდურად.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            {user ? (
                                <NewProjectButton className="elegant-btn text-lg group inline-flex items-center gap-2">
                                    <Plus size={20} /> ახალი კომიქსი
                                </NewProjectButton>
                            ) : (
                                <Link
                                    href="/auth/register?redirect=/comic"
                                    className="elegant-btn text-lg inline-flex items-center gap-2 group"
                                >
                                    დაიწყე უფასოდ <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            )}
                            <Link
                                href="#how"
                                className="elegant-btn-outline text-lg inline-flex items-center gap-2"
                            >
                                როგორ მუშაობს
                            </Link>
                        </div>

                        {/* Single bundle price (with optional discount) */}
                        <div className="flex flex-wrap items-baseline gap-3 pt-4 text-sm text-text-mutted">
                            {HAS_DIGITAL_DISCOUNT && (
                                <span className="font-serif text-xl line-through text-text-mutted/55 tabular-nums">
                                    {formatPrice(PRICES.digitalOriginal)}
                                </span>
                            )}
                            <span className="font-serif text-3xl text-primary tabular-nums">
                                {formatPrice(PRICES.digital)}
                            </span>
                            {HAS_DIGITAL_DISCOUNT && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-primary text-bg-light text-[10px] font-bold uppercase tracking-[0.18em] rounded-full">
                                    -{DIGITAL_DISCOUNT_PERCENT}%
                                </span>
                            )}
                            <span className="text-[11px] uppercase tracking-[0.22em] font-mono basis-full sm:basis-auto">
                                ბეჭდური წიგნი · PDF · მიწოდება
                            </span>
                        </div>
                    </div>

                    {/* Sample collage — slightly offset, deliberate composition */}
                    <div className="relative h-[480px] sm:h-[560px]">
                        {COMIC_STYLES.slice(0, 4).map((s, i) => {
                            const positions = [
                                "top-0 left-0 rotate-[-3deg]",
                                "top-4 right-0 rotate-[2deg]",
                                "bottom-0 left-6 rotate-[1.5deg]",
                                "bottom-4 right-4 rotate-[-2deg]",
                            ];
                            return (
                                <div
                                    key={s.id}
                                    className={`absolute w-[42%] aspect-[3/4] rounded-2xl overflow-hidden border border-rose-100 shadow-[0_18px_40px_-20px_rgba(138,31,59,0.3)] bg-rose-50/40 ${positions[i]}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={s.sample}
                                        alt={s.nameGe}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Existing projects — typographic list, no boxy cards */}
                {user && projects.length > 0 && (
                    <section className="max-w-3xl mx-auto px-6 mt-32">
                        <div className="flex items-baseline justify-between mb-6">
                            <h2 className="font-serif text-2xl text-text-dark">ჩემი კომიქსები</h2>
                            <span className="text-[11px] uppercase tracking-[0.22em] font-mono text-text-mutted/70">
                                {projects.length.toString().padStart(2, "0")}
                            </span>
                        </div>
                        <ul className="divide-y divide-rose-100/60 border-y border-rose-100/60">
                            {projects.map((p, idx) => (
                                <li key={p.id}>
                                    <Link
                                        href={resumeHref(p)}
                                        className="flex items-baseline gap-5 py-4 hover:bg-rose-50/30 -mx-3 px-3 transition-colors rounded-lg"
                                    >
                                        <span className="font-mono text-[11px] text-text-mutted/60 tabular-nums w-6 shrink-0">
                                            {(idx + 1).toString().padStart(2, "0")}
                                        </span>
                                        <span className="font-serif text-lg text-text-dark flex-1 truncate">
                                            {p.title || "უსათაურო"}
                                        </span>
                                        <StatusLabel status={p.status} paidDigital={p.paid_digital} />
                                        <span className="text-[11px] uppercase tracking-[0.18em] font-mono text-text-mutted/50 hidden sm:inline">
                                            {new Date(p.created_at).toLocaleDateString("ka-GE", {
                                                day: "2-digit",
                                                month: "short",
                                            })}
                                        </span>
                                        <ArrowRight
                                            size={14}
                                            className="text-text-mutted/40 group-hover:text-primary"
                                        />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* How it works — typographic numbered list, no cards */}
                <section id="how" className="max-w-4xl mx-auto px-6 mt-36 sm:mt-44">
                    <header className="text-center mb-16">
                        <p className="text-[11px] uppercase tracking-[0.28em] font-mono text-text-mutted/70 mb-3">
                            ოთხ ნაბიჯში
                        </p>
                        <h2 className="font-serif text-4xl sm:text-5xl text-text-dark leading-[1.05]">
                            როგორ <span className="italic text-primary">მუშაობს</span>
                        </h2>
                    </header>

                    <ol className="space-y-10">
                        {STEPS.map(({ num, icon: Icon, title, desc }) => (
                            <li
                                key={num}
                                className="grid grid-cols-[auto_1fr] gap-6 sm:gap-10 items-baseline pb-10 last:pb-0 border-b last:border-b-0 border-rose-100/60"
                            >
                                <span className="font-serif text-5xl sm:text-6xl text-rose-200/80 select-none">
                                    {num}
                                </span>
                                <div>
                                    <h3 className="font-serif text-2xl text-text-dark mb-1.5 inline-flex items-baseline gap-3">
                                        <Icon
                                            size={20}
                                            className="text-primary -translate-y-0.5 shrink-0"
                                            strokeWidth={1.75}
                                        />
                                        <span>{title}</span>
                                    </h3>
                                    <p className="text-text-mutted leading-relaxed">{desc}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* Style showcase — gallery wall, not card grid */}
                <section className="max-w-6xl mx-auto px-6 mt-36 sm:mt-44">
                    <header className="text-center mb-16">
                        <p className="text-[11px] uppercase tracking-[0.28em] font-mono text-text-mutted/70 mb-3">
                            ექვსი ხელწერა
                        </p>
                        <h2 className="font-serif text-4xl sm:text-5xl text-text-dark leading-[1.05]">
                            აირჩიე <span className="italic text-primary">სტილი</span>
                        </h2>
                    </header>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
                        {COMIC_STYLES.map((s, idx) => (
                            <figure key={s.id} className="group">
                                <div className="aspect-[3/4] rounded-2xl overflow-hidden mb-3 relative bg-rose-50/40 border border-rose-100/60 shadow-[0_14px_30px_-18px_rgba(138,31,59,0.2)]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={s.sample}
                                        alt={s.name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                    />
                                </div>
                                <figcaption className="flex items-baseline justify-between gap-3">
                                    <div>
                                        <h3 className="font-serif text-lg text-text-dark leading-tight">
                                            {s.nameGe}
                                        </h3>
                                        <p className="text-xs text-text-mutted mt-0.5">
                                            {s.taglineGe}
                                        </p>
                                    </div>
                                    <span className="font-mono text-[10px] text-text-mutted/50 tabular-nums">
                                        {(idx + 1).toString().padStart(2, "0")}
                                    </span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </section>

                {/* Closing CTA */}
                <section className="max-w-2xl mx-auto px-6 mt-36 sm:mt-44 text-center">
                    <h2 className="font-serif text-4xl sm:text-5xl text-text-dark leading-[1.05]">
                        მზად <span className="italic text-primary">ხარ?</span>
                    </h2>
                    <p className="text-text-mutted mt-4 mb-10 leading-relaxed">
                        AI მზადაა შენი ისტორიის მოსასმენად. 5 წუთში დაასრულებ.
                    </p>
                    {user ? (
                        <NewProjectButton className="elegant-btn text-lg inline-flex items-center gap-2">
                            <Plus size={20} /> ახალი კომიქსი
                        </NewProjectButton>
                    ) : (
                        <Link
                            href="/auth/register?redirect=/comic"
                            className="elegant-btn text-lg inline-flex items-center gap-2"
                        >
                            დაიწყე უფასოდ <ArrowRight size={18} />
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

function StatusLabel({ status, paidDigital }) {
    if (!paidDigital) {
        return (
            <span className="text-[10px] uppercase tracking-[0.22em] font-mono text-amber-700 hidden md:inline">
                გადახდის მოლოდინში
            </span>
        );
    }
    const map = {
        draft: "მონახაზი",
        interviewing: "ისტორია",
        characters: "პერსონაჟები",
        styling: "სტილი",
        generating: "იხატება",
        preview: "მზადაა",
        paid: "გადახდილია",
        fulfilled: "მიწოდებული",
    };
    const isDone = status === "preview" || status === "paid" || status === "fulfilled";
    return (
        <span
            className={`text-[10px] uppercase tracking-[0.22em] font-mono hidden md:inline ${
                isDone ? "text-primary" : "text-text-mutted/70"
            }`}
        >
            {map[status] || "მონახაზი"}
        </span>
    );
}
