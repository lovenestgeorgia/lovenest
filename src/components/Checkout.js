"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Heart, MapPin, User, ChevronRight, Check } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export function Checkout() {
    const { items, getCartTotal } = useCartStore();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "თბილისი",
        personalMessage: "",
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (step < 3) {
            setStep(step + 1);
            return;
        }

        setLoading(true);

        try {
            // Build order details string from cart
            const orderDetails = items.map(i => `${i.name} (${i.quantity}x)`).join(", ");
            const orderId = `ORDER-${Date.now()}`;
            const total = getCartTotal();

            // Facebook Pixel: InitiateCheckout
            if (typeof window !== 'undefined' && window.fbq) {
                window.fbq('track', 'InitiateCheckout', {
                    content_name: orderDetails,
                    value: total,
                    currency: 'GEL',
                    num_items: items.reduce((sum, i) => sum + i.quantity, 0)
                });
            }

            // 1. Initiate Real Unipay Checkout Redirect using V3 API
            const response = await fetch("/api/unipay/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, amount: total, orderId: orderId }),
            });
            const data = await response.json();

            if (data.success && data.unipayData) {
                // Determine the correct field for the checkout URL based on standard Unipay responses
                const redirectUrl =
                    data.unipayData.Checkout ||
                    data.unipayData.CheckoutUrl ||
                    data.unipayData.checkout_url ||
                    data.unipayData.url ||
                    data.unipayData.redirectUrl ||
                    data.unipayData.redirect_url ||
                    (data.unipayData.data && (
                        data.unipayData.data.Checkout ||
                        data.unipayData.data.CheckoutUrl ||
                        data.unipayData.data.checkout_url ||
                        data.unipayData.data.url ||
                        data.unipayData.data.redirectUrl ||
                        data.unipayData.data.redirect_url
                    ));

                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {
                    console.error("Unipay V3 Success Response missing URL field:", data.unipayData);
                    throw new Error("Missing checkout URL in UniPay response");
                }
            } else {
                throw new Error(data.error || "Failed to initiate UniPay checkout");
            }

        } catch (error) {
            console.error(error);
            alert("წარმოიშვა შეცდომა გადამისამართებისას.");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { num: 1, title: "ინფორმაცია", icon: User },
        { num: 2, title: "მიტანა", icon: MapPin },
        { num: 3, title: "გადახდა", icon: CreditCard }
    ];

    if (items.length === 0) {
        return (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-rose-50 text-center text-text-mutted">
                კალათა ცარიელია, გთხოვთ დაამატოთ პროდუქტი გადახდის გასაგრძელებლად.
            </div>
        );
    }

    return (
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-rose-100/50 w-full font-sans">

            {/* Stepper */}
            <div className="flex items-center justify-between pl-[10%] pr-[10%] mb-12 relative">
                <div className="absolute top-1/2 left-[15%] right-[15%] h-[2px] bg-rose-50 -translate-y-1/2 z-0"></div>
                <div
                    className="absolute top-1/2 left-[15%] h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-500"
                    style={{ width: `${(step - 1) * 35}%` }}
                ></div>

                {steps.map((s) => {
                    const Icon = s.icon;
                    const isActive = step >= s.num;
                    const isComplete = step > s.num;
                    return (
                        <div key={s.num} className="relative z-10 flex flex-col items-center gap-2 bg-white px-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-primary text-white shadow-md' : 'bg-rose-50 text-text-mutted'}`}>
                                {isComplete ? <Check size={18} /> : <Icon size={18} />}
                            </div>
                            <span className={`text-[11px] uppercase tracking-wider font-semibold ${isActive ? 'text-primary' : 'text-text-mutted'}`}>{s.title}</span>
                        </div>
                    );
                })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">

                    {/* STEP 1: Personal Info */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h3 className="text-xl font-serif text-text-dark border-b border-rose-50 pb-2">საკონტაქტო ინფორმაცია</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-text-dark">სახელი, გვარი</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-bg-light border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-primary transition-all" placeholder="გიორგი გიორგაძე" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-text-dark">ტელეფონი</label>
                                    <input type="tel" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-bg-light border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-primary transition-all" placeholder="5XX XX XX XX" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="block text-sm font-medium text-text-dark">ელ. ფოსტა (არასავალდებულო)</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-bg-light border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-primary transition-all" placeholder="example@mail.com" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: Shipping */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h3 className="text-xl font-serif text-text-dark border-b border-rose-50 pb-2">მიტანის მისამართი & დეტალები</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-text-dark">ქალაქი</label>
                                    <select value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full bg-bg-light border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-primary transition-all">
                                        <option value="თბილისი">თბილისი</option>
                                        <option value="ბათუმი">ბათუმი</option>
                                        <option value="ქუთაისი">ქუთაისი</option>
                                        <option value="რუსთავი">რუსთავი</option>
                                        <option value="სხვა">სხვა (რეგიონი)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-text-dark">მისამართი</label>
                                    <input type="text" required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-bg-light border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-primary transition-all" placeholder="ქუჩა, კორპუსი, ბინა" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="block text-sm font-medium text-text-dark flex items-center justify-between">
                                        <span>პერსონალური გზავნილი წიგნისთვის</span>
                                        <Heart size={14} className="text-primary" />
                                    </label>
                                    <textarea rows={3} value={formData.personalMessage} onChange={e => setFormData({ ...formData, personalMessage: e.target.value })} className="w-full bg-bg-light border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-primary transition-all resize-none" placeholder="რა დავაწეროთ პირველ გვერდზე? (არასავალდებულო)" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Payment Confirmation */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h3 className="text-xl font-serif text-text-dark border-b border-rose-50 pb-2">შეკვეთის შეჯამება</h3>
                            <div className="bg-rose-50/20 p-6 rounded-xl border border-rose-100 space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-mutted">მიმღები:</span>
                                    <span className="font-medium text-text-dark">{formData.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-mutted">მისამართი:</span>
                                    <span className="font-medium text-text-dark text-right">{formData.city}, {formData.address}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-mutted">ტელეფონი:</span>
                                    <span className="font-medium text-text-dark">{formData.phone}</span>
                                </div>

                                <div className="border-t border-rose-100 pt-4 mt-4 flex justify-between items-center">
                                    <span className="font-serif">სულ გადსახდელი:</span>
                                    <span className="text-2xl font-serif font-bold text-primary">{getCartTotal().toFixed(2)} ₾</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="pt-8 flex gap-4">
                    {step > 1 && (
                        <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-xl border border-gray-200 text-text-mutted hover:bg-gray-50 font-medium transition-colors">
                            უკან
                        </button>
                    )}
                    <button type="submit" disabled={loading} className="elegant-btn flex-1 flex justify-center items-center gap-2 py-4">
                        {loading ? (
                            <span className="animate-pulse">მუშავდება...</span>
                        ) : step < 3 ? (
                            <>შემდეგი <ChevronRight size={18} /></>
                        ) : (
                            <><CreditCard size={18} /> გადახდა Unipay-თ</>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}
