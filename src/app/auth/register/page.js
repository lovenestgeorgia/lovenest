"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, ChevronRight } from "lucide-react";

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // Mock registration
        setTimeout(() => {
            setLoading(false);
            alert("ანგარიში წარმატებით შეიქმნა (Mock)");
        }, 1500);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center font-sans py-24 px-6 bg-rose-50/20">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-rose-100 p-8 md:p-10"
            >
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-serif text-text-dark mb-2">რეგისტრაცია</h1>
                    <p className="text-text-mutted font-light">შექმენით ანგარიში შეკვეთების სამართავად</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-dark">სახელი</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted" size={18} />
                                <input type="text" required className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="სახელი" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-dark">გვარი</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted" size={18} />
                                <input type="text" required className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="გვარი" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-dark">ტელეფონი</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted" size={18} />
                            <input type="tel" required className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="5XX XX XX XX" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-dark">ელ. ფოსტა</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted" size={18} />
                            <input type="email" required className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="example@mail.com" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-dark">პაროლი</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted" size={18} />
                            <input type="password" required minLength={8} className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="••••••••" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="elegant-btn w-full py-3.5 shadow-md flex justify-center items-center gap-2">
                        {loading ? "მუშავდება..." : <>რეგისტრაცია <ChevronRight size={18} /></>}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-text-mutted">
                    უკვე გაქვთ ანგარიში?{" "}
                    <Link href="/auth/login" className="text-primary font-medium hover:underline">
                        ავტორიზაცია
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
