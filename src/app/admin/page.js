import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/comic/pricing";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

function startOfPeriod(daysAgo) {
    return Date.now() - daysAgo * DAY_MS;
}

function sumAmount(orders) {
    return orders.reduce((acc, o) => acc + Number(o.amount || 0), 0);
}

function countByStatus(orders, status) {
    return orders.filter((o) => o.payment_status === status).length;
}

function statusLabel(s) {
    return (
        {
            paid: "გადახდილია",
            pending: "მუშავდება",
            failed: "შეცდომა",
            cancelled: "გაუქმდა",
        }[s] || s
    );
}

function statusDot(s) {
    return (
        {
            paid: "bg-green-500",
            pending: "bg-amber-500",
            failed: "bg-red-500",
            cancelled: "bg-text-mutted/40",
        }[s] || "bg-text-mutted/40"
    );
}

function dateLabel(d) {
    const dt = new Date(d);
    return dt.toLocaleString("ka-GE", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default async function AdminHome() {
    const admin = getSupabaseAdmin();

    const [{ data: allOrders }, { data: recentProjects }, { count: usersCount }] =
        await Promise.all([
            admin
                .from("comic_orders")
                .select(
                    "id, project_id, user_id, type, amount, payment_status, payment_method, shipping_name, shipping_phone, shipping_city, shipping_address, created_at"
                )
                .order("created_at", { ascending: false })
                .limit(500),
            admin
                .from("comic_projects")
                .select("id, title, status, paid_digital, paid_print, created_at")
                .order("created_at", { ascending: false })
                .limit(8),
            // Approximate active customers — anyone who started a project.
            admin
                .from("comic_projects")
                .select("user_id", { count: "exact", head: true }),
        ]);

    const orders = allOrders || [];
    const paid = orders.filter((o) => o.payment_status === "paid");

    const windows = [
        { label: "დღეს", since: startOfPeriod(1) },
        { label: "7 დღე", since: startOfPeriod(7) },
        { label: "30 დღე", since: startOfPeriod(30) },
        { label: "სულ", since: 0 },
    ].map((w) => {
        const filtered = paid.filter(
            (o) => new Date(o.created_at).getTime() >= w.since
        );
        return {
            ...w,
            revenue: sumAmount(filtered),
            count: filtered.length,
        };
    });

    const statusCounts = ["paid", "pending", "failed", "cancelled"].map((s) => ({
        status: s,
        count: countByStatus(orders, s),
    }));

    return (
        <div className="space-y-16">
            {/* Revenue grid */}
            <section>
                <SectionHeader title="შემოსავალი" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {windows.map((w) => (
                        <div
                            key={w.label}
                            className="bg-bg-light border border-rose-100 rounded-2xl px-6 py-7"
                        >
                            <p className="text-[10px] uppercase tracking-[0.32em] font-mono text-text-mutted/70">
                                {w.label}
                            </p>
                            <p className="font-serif text-3xl sm:text-4xl text-text-dark mt-3 tabular-nums leading-none">
                                {formatPrice(w.revenue)}
                            </p>
                            <p className="text-xs text-text-mutted mt-2.5 tabular-nums">
                                {w.count.toString().padStart(2, "0")} შეკვეთა
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Status + project counts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                    <SectionHeader title="სტატუსები" />
                    <ul className="divide-y divide-rose-100 border-y border-rose-100">
                        {statusCounts.map(({ status, count }) => (
                            <li
                                key={status}
                                className="flex items-baseline justify-between py-4"
                            >
                                <span className="flex items-center gap-3 text-text-dark">
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${statusDot(status)}`}
                                    />
                                    <span>{statusLabel(status)}</span>
                                </span>
                                <span className="font-serif text-2xl text-text-dark tabular-nums">
                                    {count.toString().padStart(2, "0")}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <SectionHeader title="გადახედვა" />
                    <ul className="divide-y divide-rose-100 border-y border-rose-100">
                        <li className="flex items-baseline justify-between py-4">
                            <span className="text-text-dark">ბრძანებები სულ</span>
                            <span className="font-serif text-2xl text-text-dark tabular-nums">
                                {orders.length.toString().padStart(2, "0")}
                            </span>
                        </li>
                        <li className="flex items-baseline justify-between py-4">
                            <span className="text-text-dark">გადახდილი ბრძანებები</span>
                            <span className="font-serif text-2xl text-text-dark tabular-nums">
                                {paid.length.toString().padStart(2, "0")}
                            </span>
                        </li>
                        <li className="flex items-baseline justify-between py-4">
                            <span className="text-text-dark">საშუალო ჩეკი</span>
                            <span className="font-serif text-2xl text-text-dark tabular-nums">
                                {paid.length
                                    ? formatPrice(sumAmount(paid) / paid.length)
                                    : "—"}
                            </span>
                        </li>
                        <li className="flex items-baseline justify-between py-4">
                            <span className="text-text-dark">პროექტები სულ</span>
                            <span className="font-serif text-2xl text-text-dark tabular-nums">
                                {(usersCount ?? 0).toString().padStart(2, "0")}
                            </span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* Recent orders */}
            <section>
                <SectionHeader
                    title="ბოლო შეკვეთები"
                    action={
                        <Link
                            href="/admin/orders"
                            className="text-[11px] uppercase tracking-[0.22em] font-semibold text-primary hover:text-text-dark transition-colors inline-flex items-center gap-1"
                        >
                            ყველა <ChevronRight size={12} />
                        </Link>
                    }
                />
                <OrdersTable orders={orders.slice(0, 10)} />
            </section>

            {/* Recent projects */}
            <section>
                <SectionHeader
                    title="ბოლო პროექტები"
                    action={
                        <Link
                            href="/admin/projects"
                            className="text-[11px] uppercase tracking-[0.22em] font-semibold text-primary hover:text-text-dark transition-colors inline-flex items-center gap-1"
                        >
                            ყველა <ChevronRight size={12} />
                        </Link>
                    }
                />
                <ProjectsTable projects={recentProjects || []} />
            </section>
        </div>
    );
}

/* ───────────────────────── shared components ───────────────────────── */

function SectionHeader({ title, action }) {
    return (
        <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-[11px] uppercase tracking-[0.28em] font-mono text-text-mutted/80">
                {title}
            </h2>
            {action}
        </div>
    );
}

export function OrdersTable({ orders }) {
    if (orders.length === 0) {
        return (
            <p className="text-text-mutted italic py-10 text-center border-y border-rose-100">
                შეკვეთები ჯერ არ არის.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-[10px] uppercase tracking-[0.22em] font-mono text-text-mutted/70 text-left border-b border-rose-100">
                        <th className="py-3 pr-4 font-medium">თარიღი</th>
                        <th className="py-3 pr-4 font-medium">თანხა</th>
                        <th className="py-3 pr-4 font-medium">ტიპი</th>
                        <th className="py-3 pr-4 font-medium">სტატუსი</th>
                        <th className="py-3 pr-4 font-medium">მიმღები</th>
                        <th className="py-3 pr-4 font-medium hidden lg:table-cell">
                            მისამართი
                        </th>
                        <th className="py-3 pr-4 font-medium">პროექტი</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((o) => (
                        <tr
                            key={o.id}
                            className="border-b border-rose-100/60 hover:bg-rose-50/30 transition-colors"
                        >
                            <td className="py-3 pr-4 text-text-mutted whitespace-nowrap tabular-nums">
                                {dateLabel(o.created_at)}
                            </td>
                            <td className="py-3 pr-4 font-serif text-base tabular-nums">
                                {formatPrice(o.amount)}
                            </td>
                            <td className="py-3 pr-4 text-text-mutted">
                                {o.type === "digital" ? "ციფრული" : "ბეჭდური"}
                            </td>
                            <td className="py-3 pr-4">
                                <span className="inline-flex items-center gap-1.5">
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${statusDot(o.payment_status)}`}
                                    />
                                    <span className="text-[12px] uppercase tracking-[0.16em] font-mono">
                                        {statusLabel(o.payment_status)}
                                    </span>
                                </span>
                            </td>
                            <td className="py-3 pr-4 text-text-dark whitespace-nowrap max-w-[180px] truncate">
                                {o.shipping_name || (
                                    <span className="text-text-mutted/60">—</span>
                                )}
                                {o.shipping_phone && (
                                    <span className="block text-[11px] text-text-mutted tabular-nums">
                                        {o.shipping_phone}
                                    </span>
                                )}
                            </td>
                            <td className="py-3 pr-4 text-text-mutted hidden lg:table-cell max-w-[260px] truncate">
                                {o.shipping_city ? (
                                    <>
                                        <span>{o.shipping_city}</span>
                                        {o.shipping_address && (
                                            <span className="block text-[11px] text-text-mutted/80 truncate">
                                                {o.shipping_address}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-text-mutted/60">—</span>
                                )}
                            </td>
                            <td className="py-3 pr-4 font-mono text-[11px] tabular-nums">
                                {o.project_id ? (
                                    <Link
                                        href={`/comic/${o.project_id}`}
                                        className="inline-flex items-center gap-1 text-primary hover:text-text-dark underline-offset-[3px] hover:underline transition-colors"
                                    >
                                        {o.project_id.slice(0, 8)}
                                        <ChevronRight size={11} />
                                    </Link>
                                ) : (
                                    <span className="text-text-mutted/70">—</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function ProjectsTable({ projects }) {
    if (projects.length === 0) {
        return (
            <p className="text-text-mutted italic py-10 text-center border-y border-rose-100">
                პროექტები ჯერ არ არის.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-[10px] uppercase tracking-[0.22em] font-mono text-text-mutted/70 text-left border-b border-rose-100">
                        <th className="py-3 pr-4 font-medium">თარიღი</th>
                        <th className="py-3 pr-4 font-medium">სათაური</th>
                        <th className="py-3 pr-4 font-medium">სტატუსი</th>
                        <th className="py-3 pr-4 font-medium">გადახდილი</th>
                        <th className="py-3 pr-4 font-medium">ID</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((p) => (
                        <tr
                            key={p.id}
                            className="border-b border-rose-100/60 hover:bg-rose-50/30 transition-colors"
                        >
                            <td className="py-3 pr-4 text-text-mutted whitespace-nowrap tabular-nums">
                                {dateLabel(p.created_at)}
                            </td>
                            <td className="py-3 pr-4 text-text-dark max-w-[280px] truncate">
                                <Link
                                    href={`/comic/${p.id}`}
                                    className="hover:text-primary transition-colors"
                                >
                                    {p.title || (
                                        <span className="text-text-mutted/60 italic">
                                            უსათაურო
                                        </span>
                                    )}
                                </Link>
                            </td>
                            <td className="py-3 pr-4 text-text-mutted text-[12px] uppercase tracking-[0.16em] font-mono">
                                {p.status || "—"}
                            </td>
                            <td className="py-3 pr-4">
                                <span className="inline-flex items-baseline gap-2 text-[11px] uppercase tracking-[0.16em] font-mono">
                                    {p.paid_digital ? (
                                        <span className="text-green-700">✓ ციფრ.</span>
                                    ) : (
                                        <span className="text-text-mutted/50">— ციფრ.</span>
                                    )}
                                    {p.paid_print ? (
                                        <span className="text-green-700">✓ ბეჭდ.</span>
                                    ) : (
                                        <span className="text-text-mutted/50">— ბეჭდ.</span>
                                    )}
                                </span>
                            </td>
                            <td className="py-3 pr-4 font-mono text-[11px] tabular-nums">
                                <Link
                                    href={`/comic/${p.id}`}
                                    className="inline-flex items-center gap-1 text-primary hover:text-text-dark underline-offset-[3px] hover:underline transition-colors"
                                >
                                    {p.id.slice(0, 8)}
                                    <ChevronRight size={11} />
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
