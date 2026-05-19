"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function statusFor(c) {
    if (!c.active) return { label: "გათიშული", color: "text-text-mutted" };
    if (c.expires_at && new Date(c.expires_at).getTime() < Date.now())
        return { label: "ვადაგასული", color: "text-red-700" };
    if (c.max_uses != null && c.uses >= c.max_uses)
        return { label: "ამოწურული", color: "text-amber-700" };
    return { label: "აქტიური", color: "text-green-700" };
}

function discountLabel(c) {
    if (c.discount_type === "percent") return `${Number(c.discount_value)}%`;
    return `${Number(c.discount_value).toFixed(2)} ₾`;
}

function dateLabel(d) {
    if (!d) return "—";
    return new Date(d).toLocaleString("ka-GE", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
    });
}

export function PromocodeRow({ code: c }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    const toggle = async () => {
        if (busy) return;
        setBusy(true);
        try {
            await fetch(`/api/admin/promocodes/${c.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: !c.active }),
            });
            router.refresh();
        } finally {
            setBusy(false);
        }
    };

    const del = async () => {
        if (busy) return;
        if (!confirm(`წაიშალოს კოდი ${c.code}?`)) return;
        setBusy(true);
        try {
            await fetch(`/api/admin/promocodes/${c.id}`, { method: "DELETE" });
            router.refresh();
        } finally {
            setBusy(false);
        }
    };

    const st = statusFor(c);

    return (
        <tr className="border-b border-rose-100/60 hover:bg-rose-50/30 transition-colors">
            <td className="py-3 pr-4 font-mono text-sm font-bold tracking-wider text-text-dark">
                {c.code}
            </td>
            <td className="py-3 pr-4 text-text-dark tabular-nums">
                {discountLabel(c)}
            </td>
            <td className="py-3 pr-4 text-text-mutted text-[13px] tabular-nums">
                {c.uses}
                {c.max_uses != null ? ` / ${c.max_uses}` : ""}
            </td>
            <td className="py-3 pr-4 text-text-mutted text-[13px] whitespace-nowrap">
                {dateLabel(c.expires_at)}
            </td>
            <td className="py-3 pr-4 text-[12px] uppercase tracking-[0.16em] font-mono">
                <span className={st.color}>{st.label}</span>
            </td>
            <td className="py-3 pr-4 text-text-mutted text-[13px] hidden lg:table-cell max-w-[260px] truncate">
                {c.description || "—"}
            </td>
            <td className="py-3 pr-4 text-right whitespace-nowrap">
                <button
                    onClick={toggle}
                    disabled={busy}
                    className="text-[11px] uppercase tracking-[0.18em] text-text-mutted hover:text-primary disabled:opacity-40 mr-3"
                >
                    {c.active ? "გათიშე" : "ჩართე"}
                </button>
                <button
                    onClick={del}
                    disabled={busy}
                    className="text-[11px] uppercase tracking-[0.18em] text-red-600 hover:text-red-700 disabled:opacity-40"
                >
                    წაშლა
                </button>
            </td>
        </tr>
    );
}
