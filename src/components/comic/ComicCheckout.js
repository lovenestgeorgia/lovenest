"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Truck, CreditCard, Check } from "lucide-react";
import { PRICES } from "@/lib/comic/pricing";

export function ComicCheckout({ projectId, userEmail, hasDigital, hasPrint }) {
    const router = useRouter();
    const [type, setType] = useState(hasDigital ? "print" : "digital");
    const [paymentMethod, setPaymentMethod] = useState("unipay");
    const [form, setForm] = useState({
        name: "",
        phone: "",
        email: userEmail || "",
        city: "თბილისი",
        address: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const total = PRICES[type];

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/comic/projects/${projectId}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, paymentMethod, customer: form }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");

            if (json.redirectUrl) {
                window.location.href = json.redirectUrl;
                return;
            }
            if (json.codSuccess) {
                setSuccess("შეკვეთა მიღებულია! მალე დაგიკავშირდებით.");
                setTimeout(() => router.push(`/comic/${projectId}/done`), 1500);
            }
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <Check size={32} />
                </div>
                <p className="text-lg text-text-dark">{success}</p>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-8">
            {/* Format selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormatCard
                    icon={Download}
                    title="ციფრული"
                    subtitle="PDF, ჩამოტვირთვა"
                    price={PRICES.digital}
                    selected={type === "digital"}
                    onClick={() => setType("digital")}
                    disabled={hasDigital}
                />
                <FormatCard
                    icon={Truck}
                    title="ბეჭდური წიგნი"
                    subtitle="მაგარი ყდა + მიწოდება"
                    price={PRICES.print}
                    selected={type === "print"}
                    onClick={() => setType("print")}
                    disabled={hasPrint}
                />
            </div>

            {/* Shipping form for print */}
            {type === "print" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="სახელი, გვარი" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                    <Input label="ტელეფონი" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-dark">ქალაქი</label>
                        <select
                            value={form.city}
                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                            className="w-full bg-bg-light border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-primary"
                        >
                            <option value="თბილისი">თბილისი</option>
                            <option value="ბათუმი">ბათუმი</option>
                            <option value="ქუთაისი">ქუთაისი</option>
                            <option value="რუსთავი">რუსთავი</option>
                            <option value="სხვა">სხვა (რეგიონი)</option>
                        </select>
                    </div>
                    <Input label="მისამართი" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
                </div>
            )}

            <Input
                label="ელ. ფოსტა"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                required={type === "digital"}
            />

            {/* Payment method */}
            <div className="space-y-3">
                <h3 className="font-medium text-text-dark">გადახდის მეთოდი</h3>
                <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        paymentMethod === "unipay" ? "border-primary bg-rose-50/10" : "border-gray-200"
                    }`}
                >
                    <input
                        type="radio"
                        name="pm"
                        checked={paymentMethod === "unipay"}
                        onChange={() => setPaymentMethod("unipay")}
                    />
                    <div>
                        <div className="font-medium flex items-center gap-2">
                            <CreditCard size={16} /> ბარათით (UniPay)
                        </div>
                        <div className="text-xs text-text-mutted mt-1">ციფრულისთვის სავალდებულო</div>
                    </div>
                </label>
                {type === "print" && (
                    <label
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            paymentMethod === "cod" ? "border-primary bg-rose-50/10" : "border-gray-200"
                        }`}
                    >
                        <input
                            type="radio"
                            name="pm"
                            checked={paymentMethod === "cod"}
                            onChange={() => setPaymentMethod("cod")}
                        />
                        <div>
                            <div className="font-medium">🚚 ნაღდი კურიერთან</div>
                            <div className="text-xs text-text-mutted mt-1">გადაიხდით ამანათის მიღებისას</div>
                        </div>
                    </label>
                )}
            </div>

            <div className="border-t border-rose-50 pt-6 flex items-center justify-between">
                <span className="font-serif text-lg">სულ:</span>
                <span className="text-3xl font-serif font-bold text-primary">{total.toFixed(2)} ₾</span>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
                type="submit"
                disabled={loading || (type === "digital" && paymentMethod === "cod")}
                className="elegant-btn w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-40"
            >
                {loading ? "მუშავდება..." : paymentMethod === "cod" ? "შეკვეთის გაფორმება" : "გადახდა UniPay-თ"}
            </button>
        </form>
    );
}

function FormatCard({ icon: Icon, title, subtitle, price, selected, onClick, disabled }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`p-6 rounded-2xl border-2 text-left transition-all relative ${
                selected ? "border-primary shadow-md bg-rose-50/10" : "border-gray-200 hover:border-rose-200"
            } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        >
            <Icon size={28} className={selected ? "text-primary" : "text-text-mutted"} />
            <h4 className="font-serif font-bold text-text-dark mt-3">{title}</h4>
            <p className="text-xs text-text-mutted">{subtitle}</p>
            <p className="text-2xl font-serif text-primary mt-3">{price} ₾</p>
            {disabled && (
                <span className="absolute top-3 right-3 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
                    შეძენილია
                </span>
            )}
        </button>
    );
}

function Input({ label, value, onChange, type = "text", required }) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-text-dark">{label}</label>
            <input
                type={type}
                value={value}
                required={required}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-bg-light border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-primary"
            />
        </div>
    );
}
