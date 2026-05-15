"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ChevronRight, ArrowLeft } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
            });
            if (error) throw error;
            setSent(true);
        } catch (err) {
            setError(err.message || "ვერ მოხერხდა გაგზავნა");
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center font-sans pt-40 sm:pt-44 pb-16 px-6 bg-rose-50/20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-rose-100 p-8 md:p-10 text-center space-y-4"
                >
                    <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 text-primary flex items-center justify-center">
                        <Mail size={28} />
                    </div>
                    <h1 className="text-2xl font-serif text-text-dark">შეამოწმე ფოსტა</h1>
                    <p className="text-text-mutted">
                        გამოგზავნილია პაროლის აღდგენის ბმული <strong>{email}</strong>-ზე.
                        გადადი წერილზე და დააწექი ბმულს ახალი პაროლის დასაყენებლად.
                    </p>
                    <p className="text-xs text-text-mutted">
                        ბმული მოქმედია ერთი საათის განმავლობაში.
                    </p>
                    <Link
                        href="/auth/login"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1 pt-2"
                    >
                        <ArrowLeft size={14} /> ავტორიზაციაზე დაბრუნება
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center font-sans pt-40 sm:pt-44 pb-16 px-6 bg-rose-50/20">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-rose-100 p-8 md:p-10"
            >
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-serif text-text-dark mb-2">დაგავიწყდა პაროლი?</h1>
                    <p className="text-text-mutted font-light">
                        შეიყვანე შენი ელ. ფოსტა და გამოგიგზავნით აღდგენის ბმულს.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-dark">ელ. ფოსტა</label>
                        <div className="relative">
                            <Mail
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted"
                                size={18}
                            />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                placeholder="example@mail.com"
                                autoFocus
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
                        {loading ? "იგზავნება..." : <>გაგზავნა <ChevronRight size={18} /></>}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-text-mutted">
                    <Link
                        href="/auth/login"
                        className="text-primary font-medium hover:underline inline-flex items-center gap-1"
                    >
                        <ArrowLeft size={14} /> ავტორიზაციაზე დაბრუნება
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
