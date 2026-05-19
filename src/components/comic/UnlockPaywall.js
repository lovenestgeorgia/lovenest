"use client";

import { useState } from "react";
import {
    CreditCard,
    Sparkles,
    Truck,
    Tag,
    Check,
    X,
} from "lucide-react";
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

    // Promocode state — applied is the validated result the server returned
    const [promoInput, setPromoInput] = useState("");
    const [promoChecking, setPromoChecking] = useState(false);
    const [promoError, setPromoError] = useState(null);
    const [applied, setApplied] = useState(null); // { code, finalAmount, discount }

    const update = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const allFilled =
        form.name.trim() &&
        form.phone.trim() &&
        form.city.trim() &&
        form.address.trim();

    const effectivePrice = applied ? applied.finalAmount : PRICES.digital;

    const checkPromo = async () => {
        if (!promoInput.trim() || promoChecking) return;
        setPromoChecking(true);
        setPromoError(null);
        try {
            const res = await fetch("/api/comic/promocodes/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: promoInput.trim() }),
            });
            const json = await res.json();
            if (json.valid) {
                setApplied({
                    code: json.code,
                    finalAmount: json.finalAmount,
                    discount: json.discount,
                });
                setPromoError(null);
            } else {
                setApplied(null);
                setPromoError(json.message || "პრომოკოდი არასწორია");
            }
        } catch (e) {
            setPromoError("შემოწმება ვერ მოხერხდა");
        } finally {
            setPromoChecking(false);
        }
    };

    const clearPromo = () => {
        setApplied(null);
        setPromoInput("");
        setPromoError(null);
    };

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
                    promocode: applied?.code || undefined,
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
            if (!res.ok) {
                if (json.promocodeInvalid) {
                    setApplied(null);
                    setPromoError(json.error);
                    setError("პრომოკოდის სტატუსი შეიცვალა. სცადე ხელახლა.");
                    return;
                }
                throw new Error(json.error || "Payment failed");
            }
            // Free order via 100% promocode — skip UniPay entirely
            if (json.free && json.redirectTo) {
                window.location.href = json.redirectTo;
                return;
            }
            if (json.redirectUrl) {
                window.location.href = json.redirectUrl;
                return;
            }
            throw new Error("გადახდის ბმული ვერ მივიღეთ");
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

            {/* Promocode fieldset */}
            <fieldset className="space-y-3 pt-2">
                <legend className="flex items-baseline gap-3 mb-1">
                    <span className="inline-flex w-7 h-7 rounded-full bg-rose-50 text-primary items-center justify-center">
                        <Tag size={13} />
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.24em] font-semibold text-text-mutted">
                        პრომოკოდი
                    </span>
                </legend>

                {applied ? (
                    <div className="flex items-center justify-between gap-3 bg-rose-50/60 border border-rose-100 rounded-lg px-4 py-3">
                        <div className="flex items-baseline gap-3 min-w-0">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-bg-light shrink-0">
                                <Check size={13} />
                            </span>
                            <span className="font-mono text-sm font-bold tracking-wider text-text-dark truncate">
                                {applied.code}
                            </span>
                            <span className="text-[12px] text-primary font-semibold">
                                -{formatPrice(applied.discount)}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={clearPromo}
                            className="text-text-mutted hover:text-primary transition-colors shrink-0 p-1 -mr-1"
                            aria-label="წაშალე პრომოკოდი"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={promoInput}
                            onChange={(e) => {
                                setPromoInput(e.target.value);
                                if (promoError) setPromoError(null);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    checkPromo();
                                }
                            }}
                            placeholder="აქ შეიყვანე კოდი"
                            className="flex-1 bg-bg-light border border-gray-200 rounded-lg px-3 py-2.5 text-[15px] outline-none focus:border-primary uppercase tracking-wider font-mono"
                        />
                        <button
                            type="button"
                            onClick={checkPromo}
                            disabled={!promoInput.trim() || promoChecking}
                            className="px-4 py-2.5 rounded-lg bg-text-dark text-bg-light text-[13px] font-medium uppercase tracking-[0.16em] hover:bg-primary transition-colors disabled:opacity-40"
                        >
                            {promoChecking ? "..." : "გადამოწმება"}
                        </button>
                    </div>
                )}
                {promoError && (
                    <p className="text-[12px] text-red-600">{promoError}</p>
                )}
            </fieldset>

            <div className="space-y-3 pt-2">
                <button
                    type="submit"
                    disabled={loading || !allFilled}
                    className="elegant-btn w-full py-4 text-lg flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                    {loading ? (
                        "გადამისამართება..."
                    ) : effectivePrice === 0 ? (
                        <>
                            <Sparkles size={20} />
                            <span>დაიწყე უფასოდ</span>
                        </>
                    ) : (
                        <>
                            <CreditCard size={20} />
                            <span>გადახდე</span>
                            {(applied ||
                                (HAS_DIGITAL_DISCOUNT && PRICES.digitalOriginal)) && (
                                <span className="line-through text-bg-light/55 text-sm font-medium">
                                    {formatPrice(
                                        applied ? PRICES.digital : PRICES.digitalOriginal
                                    )}
                                </span>
                            )}
                            <span>{formatPrice(effectivePrice)}</span>
                            <Sparkles size={16} />
                        </>
                    )}
                </button>
                {(applied || (HAS_DIGITAL_DISCOUNT && !loading)) && (
                    <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-primary text-center">
                        დაზოგე{" "}
                        {formatPrice(
                            applied
                                ? PRICES.digital - applied.finalAmount + (PRICES.digitalOriginal ? PRICES.digitalOriginal - PRICES.digital : 0)
                                : PRICES.digitalOriginal - PRICES.digital
                        )}
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
