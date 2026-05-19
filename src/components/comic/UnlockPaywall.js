"use client";

import { useState } from "react";
import { CreditCard, Sparkles } from "lucide-react";
import {
    PRICES,
    formatPrice,
    HAS_DIGITAL_DISCOUNT,
    DIGITAL_DISCOUNT_PERCENT,
} from "@/lib/comic/pricing";

export function UnlockPaywall({ projectId, userEmail }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const pay = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/comic/projects/${projectId}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "digital",
                    paymentMethod: "unipay",
                    customer: { email: userEmail || "" },
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Payment failed");
            if (json.redirectUrl) {
                window.location.href = json.redirectUrl;
                return;
            }
            throw new Error("UniPay did not return a redirect URL");
        } catch (e) {
            setError(e.message);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            <button
                onClick={pay}
                disabled={loading}
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
    );
}
