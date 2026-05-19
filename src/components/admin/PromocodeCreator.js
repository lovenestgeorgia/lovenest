"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

const PRESETS = [
    { label: "10% off", type: "percent", value: 10 },
    { label: "20% off", type: "percent", value: 20 },
    { label: "30 ₾ off", type: "fixed", value: 30 },
    { label: "100% free", type: "percent", value: 100 },
];

export function PromocodeCreator() {
    const router = useRouter();
    const [form, setForm] = useState({
        code: "",
        type: "percent",
        value: 10,
        maxUses: "",
        expiresAt: "",
        description: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const set = (k) => (e) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e?.preventDefault();
        if (saving) return;
        if (!form.code.trim()) return setError("შეიყვანე კოდი");
        const value = Number(form.value);
        if (!Number.isFinite(value) || value < 0) {
            return setError("ფასდაკლების მნიშვნელობა არასწორია");
        }
        if (form.type === "percent" && value > 100) {
            return setError("პროცენტული ფასდაკლება 0-100 დიაპაზონში უნდა იყოს");
        }
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/promocodes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: form.code.trim().toUpperCase(),
                    discount_type: form.type,
                    discount_value: value,
                    max_uses: form.maxUses ? Number(form.maxUses) : null,
                    expires_at: form.expiresAt || null,
                    description: form.description.trim() || null,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "ვერ შეიქმნა");
            setForm({
                code: "",
                type: "percent",
                value: 10,
                maxUses: "",
                expiresAt: "",
                description: "",
            });
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="bg-bg-light border border-rose-100 rounded-2xl p-5 sm:p-6 space-y-5"
        >
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 sm:items-end">
                <div className="space-y-2">
                    <label className="block text-[11px] uppercase tracking-[0.22em] font-medium text-text-mutted">
                        კოდი
                    </label>
                    <input
                        value={form.code}
                        onChange={(e) =>
                            setForm((f) => ({
                                ...f,
                                code: e.target.value.toUpperCase().replace(/\s/g, ""),
                            }))
                        }
                        placeholder="WELCOME10"
                        className="w-full bg-bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] font-mono uppercase tracking-wider outline-none focus:border-primary"
                    />
                </div>

                <div className="space-y-2">
                    <label className="block text-[11px] uppercase tracking-[0.22em] font-medium text-text-mutted">
                        ტიპი
                    </label>
                    <select
                        value={form.type}
                        onChange={set("type")}
                        className="bg-bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary"
                    >
                        <option value="percent">პროცენტი</option>
                        <option value="fixed">ფიქს. ₾</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="block text-[11px] uppercase tracking-[0.22em] font-medium text-text-mutted">
                        მნიშვნელობა
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={form.type === "percent" ? "100" : undefined}
                        value={form.value}
                        onChange={set("value")}
                        className="w-32 bg-bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] tabular-nums outline-none focus:border-primary"
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                    <button
                        key={p.label}
                        type="button"
                        onClick={() =>
                            setForm((f) => ({ ...f, type: p.type, value: p.value }))
                        }
                        className="text-[11px] uppercase tracking-[0.18em] font-medium text-text-mutted hover:text-primary border border-rose-100 hover:border-primary rounded-full px-3 py-1.5 transition-colors"
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                    <label className="block text-[11px] uppercase tracking-[0.22em] font-medium text-text-mutted">
                        მაქს. გამოყენება
                    </label>
                    <input
                        type="number"
                        min="1"
                        value={form.maxUses}
                        onChange={set("maxUses")}
                        placeholder="უსასრულო"
                        className="w-full bg-bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] tabular-nums outline-none focus:border-primary"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-[11px] uppercase tracking-[0.22em] font-medium text-text-mutted">
                        ვადა
                    </label>
                    <input
                        type="datetime-local"
                        value={form.expiresAt}
                        onChange={set("expiresAt")}
                        className="w-full bg-bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-primary"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-[11px] uppercase tracking-[0.22em] font-medium text-text-mutted">
                        შენიშვნა
                    </label>
                    <input
                        value={form.description}
                        onChange={set("description")}
                        placeholder="არჩევითი"
                        className="w-full bg-bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary"
                    />
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={saving}
                className="elegant-btn inline-flex items-center gap-2 disabled:opacity-40"
            >
                <Plus size={16} />
                {saving ? "იქმნება..." : "შექმენი პრომოკოდი"}
            </button>
        </form>
    );
}
