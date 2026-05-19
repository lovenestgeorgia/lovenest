"use client";

import { useState } from "react";
import { CreditCard, Sparkles, Truck } from "lucide-react";
import {
    PRICES,
    formatPrice,
    HAS_DIGITAL_DISCOUNT,
    DIGITAL_DISCOUNT_PERCENT,
} from "@/lib/comic/pricing";

const CITIES = ["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი", "სხვა (რეგიონი)"];

export function UnlockPaywall({ projectId, userEmail }) {
    const [form, setForm] = useState({
        name: "",
        phone: "",
        city: CITIES[0],
        address: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const update = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const allFilled =
        form.name.trim() &&
        form.phone.trim() &&
        form.city.trim() &&
        form.address.trim();

    const pay = async (e) => {
        e?.preventDefault();
        if (!allFilled || loading) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/comic/projects/${projectId}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "digital",
                    paymentMethod: "unipay",
                    customer: {
                        email: userEmail || "",
                        name: form.name.trim(),
                        phone: form.phone.trim(),
                        city: form.city.trim(),
                        address: form.address.trim(),
                    },
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Payment failed");
            if (json.redirectUrl) {
                window.location.href = json.redirectUrl;
                return;
            }
            throw new Error("UniPay did not return a redirect URL");
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <form onSubmit={pay} className="space-y-7">
            {/* Shipping fieldset */}
            <fieldset className="space-y-4">
                <legend className="flex items-baseline gap-3 mb-1">
                    <span className="inline-flex w-7 h-7 rounded-full bg-rose-50 text-primary items-center justify-center">
                        <Truck size={14} />
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.24em] font-semibold text-text-mutted">
                        მისამართი ბეჭდურისთვის
                    </span>
                </legend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                        label="სახელი, გვარი"
                        value={form.name}
                        onChange={update("name")}
                        autoComplete="name"
                        required
                    />
                    <Field
                        label="ტელეფონი"
                        type="tel"
                        value={form.phone}
                        onChange={update("phone")}
                        autoComplete="tel"
                        placeholder="5XX XX XX XX"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-4">
                    <div className="space-y-2">
                        <label className="block text-[11px] uppercase tracking-[0.22em] font-medium text-text-mutted">
                            ქალაქი
                        </label>
                        <select
                            value={form.city}
                            onChange={update("city")}
                            className="w-full bg-bg-light border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary"
                        >
                            {CITIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Field
                        label="მისამართი"
                        value={form.address}
                        onChange={update("address")}
                        autoComplete="street-address"
                        placeholder="ქუჩა, შენობა, ბინა"
                        required
                    />
                </div>
            </fieldset>

            <div className="space-y-3 pt-2">
                <button
                    type="submit"
                    disabled={loading || !allFilled}
                    className="elegant-btn w-full py-4 text-lg flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                    {loading ? (
                        "გადამისამართება..."
                    ) : (
                        <>
                            <CreditCard size={20} />
                            <span>გადახდე</span>
                            {HAS_DIGITAL_DISCOUNT && (
                                <span className="line-through text-bg-light/55 text-sm font-medium">
                                    {formatPrice(PRICES.digitalOriginal)}
                                </span>
                            )}
                            <span>{formatPrice(PRICES.digital)}</span>
                            <Sparkles size={16} />
                        </>
                    )}
                </button>
                {HAS_DIGITAL_DISCOUNT && !loading && (
                    <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-primary text-center">
                        დაზოგე {formatPrice(PRICES.digitalOriginal - PRICES.digital)} · -{DIGITAL_DISCOUNT_PERCENT}%
                    </p>
                )}
                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                        {error}
                    </p>
                )}
                <p className="text-[11px] text-text-mutted text-center">
                    გადახდა მუშავდება UniPay-ის უსაფრთხო სისტემით (256-bit).
                </p>
            </div>
        </form>
    );
}

function Field({ label, value, onChange, type = "text", required, ...rest }) {
    return (
        <div className="space-y-2">
            <label className="block text-[11px] uppercase tracking-[0.22em] font-medium text-text-mutted">
                {label}
                {required && <span className="text-primary"> *</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                className="w-full bg-bg-light border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary"
                {...rest}
            />
        </div>
    );
}
