"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Phone, ChevronRight } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function RegisterPage() {
    const router = useRouter();
    const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: {
                        first_name: form.firstName,
                        last_name: form.lastName,
                        phone: form.phone,
                    },
                },
            });
            if (error) throw error;

            // Force-confirm the email server-side so the user can sign in
            // immediately without clicking a confirmation link.
            await fetch("/api/auth/auto-confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email }),
            }).catch(() => {});

            // signUp returned no session because the user is freshly created;
            // sign in explicitly so the session cookie is set before redirect.
            const { error: signInErr } = await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password,
            });
            if (signInErr) throw signInErr;

            router.push("/comic");
            router.refresh();
        } catch (err) {
            setError(err.message || "რეგისტრაცია ვერ მოხერხდა");
        } finally {
            setLoading(false);
        }
    };

    const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    return (
        <div className="min-h-[80vh] flex items-center justify-center font-sans pt-40 sm:pt-44 pb-16 px-6 bg-rose-50/20">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-rose-100 p-8 md:p-10"
            >
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-serif text-text-dark mb-2">რეგისტრაცია</h1>
                    <p className="text-text-mutted font-light">შექმენით ანგარიში თქვენი კომიქსების სამართავად</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-dark">სახელი</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={form.firstName}
                                    onChange={onChange("firstName")}
                                    className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="სახელი"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-dark">გვარი</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={form.lastName}
                                    onChange={onChange("lastName")}
                                    className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder="გვარი"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-dark">ტელეფონი</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted" size={18} />
                            <input
                                type="tel"
                                required
                                value={form.phone}
                                onChange={onChange("phone")}
                                className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                placeholder="5XX XX XX XX"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-dark">ელ. ფოსტა</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted" size={18} />
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={onChange("email")}
                                className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                placeholder="example@mail.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-dark">პაროლი</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted" size={18} />
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={form.password}
                                onChange={onChange("password")}
                                className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="elegant-btn w-full py-3.5 shadow-md flex justify-center items-center gap-2"
                    >
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
