import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isDevUser } from "@/lib/comic/access";
import { StudioSheet } from "@/components/comic/StudioChrome";
import { Download, Truck } from "lucide-react";

export default async function DonePage({ params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    const [{ data: project }, { data: orders }] = await Promise.all([
        supabase
            .from("comic_projects")
            .select("id, title, paid_digital, paid_print")
            .eq("id", id)
            .single(),
        supabase
            .from("comic_orders")
            .select("id, type, payment_status, payment_method, amount, created_at, shipping_name")
            .eq("project_id", id)
            .order("created_at", { ascending: false }),
    ]);

    if (!project) notFound();
    const devAccess = isDevUser(user);
    const canDownload = project.paid_digital || devAccess;

    return (
        <StudioSheet className="p-8 sm:p-12">
            {/* Wax-seal style stamp instead of a circle-and-icon */}
            <header className="text-center mb-12">
                <p className="text-[10px] uppercase tracking-[0.28em] text-text-mutted/70 font-mono mb-4">
                    შენი ნამუშევარი
                </p>
                <h1 className="font-serif text-5xl sm:text-6xl text-text-dark leading-[1.05] tracking-tight">
                    {project.title || "კომიქსი"}
                </h1>
                <p className="font-serif italic text-primary text-lg mt-3">მზადაა</p>
            </header>

            {/* Primary action */}
            {canDownload && (
                <div className="max-w-md mx-auto mb-10">
                    <a
                        href={`/api/comic/projects/${id}/pdf`}
                        className="elegant-btn w-full inline-flex items-center justify-center gap-2 py-4 text-lg"
                    >
                        <Download size={20} /> ჩამოტვირთე PDF
                    </a>
                </div>
            )}

            {/* Print status */}
            {project.paid_print && (
                <div className="max-w-md mx-auto mb-10 flex items-start gap-4 border-l border-amber-200 pl-5">
                    <Truck className="text-amber-700 shrink-0 mt-0.5" size={18} />
                    <div className="text-sm leading-relaxed">
                        <p className="text-text-dark font-medium mb-1">ბეჭდური წიგნი მზადდება</p>
                        <p className="text-text-mutted">
                            1-3 დღეში ჩვენი გუნდი დაგიკავშირდება მიწოდების დასაზუსტებლად.
                        </p>
                    </div>
                </div>
            )}

            {/* Orders ledger */}
            {(orders || []).length > 0 && (
                <div className="max-w-md mx-auto">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-text-mutted/70 font-mono text-center mb-4">
                        ლეჯერი
                    </p>
                    <ul className="divide-y divide-rose-100/60 border-y border-rose-100/60">
                        {orders.map((o) => (
                            <li
                                key={o.id}
                                className="flex items-baseline justify-between py-3 text-sm"
                            >
                                <div className="flex items-baseline gap-3">
                                    <span className="font-medium text-text-dark">
                                        {o.type === "digital" ? "ციფრული" : "ბეჭდური"}
                                    </span>
                                    <span className="text-[11px] uppercase tracking-[0.18em] text-text-mutted/70 font-mono">
                                        {o.payment_method === "cod" ? "ნაღდი" : "unipay"}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-4">
                                    <span className="font-mono tabular-nums text-text-dark">
                                        {Number(o.amount).toFixed(2)} ₾
                                    </span>
                                    <OrderStatusDot status={o.payment_status} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="text-center mt-12">
                <Link
                    href={`/comic/${id}/preview`}
                    className="text-[11px] uppercase tracking-[0.22em] text-text-mutted/70 hover:text-primary transition-colors font-medium"
                >
                    ← გადახედე კომიქსს
                </Link>
            </div>
        </StudioSheet>
    );
}

function OrderStatusDot({ status }) {
    const map = {
        paid: { color: "text-green-700", dot: "bg-green-500", label: "გადახდილია" },
        failed: { color: "text-red-700", dot: "bg-red-500", label: "შეცდომა" },
        pending: { color: "text-amber-700", dot: "bg-amber-500", label: "მუშავდება" },
        cancelled: { color: "text-text-mutted", dot: "bg-text-mutted/40", label: "გაუქმდა" },
    };
    const v = map[status] || map.pending;
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-mono ${v.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
            {v.label}
        </span>
    );
}
