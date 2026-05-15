"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, ChevronRight, Check } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);
    const [hasSession, setHasSession] = useState(null);

    // Confirm we actually have a recovery session (from the email link).
    useEffect(() => {
        const supabase = getSupabaseBrowser();
        supabase.auth.getSession().then(({ data }) => {
            setHasSession(!!data.session);
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setError("პაროლები არ ემთხვევა");
            return;
        }
        if (password.length < 8) {
            setError("პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setDone(true);
            setTimeout(() => {
                router.push("/comic");
                router.refresh();
            }, 1500);
        } catch (err) {
            setError(err.message || "ვერ შეიცვალა");
        } finally {
            setLoading(false);
        }
    };

    if (hasSession === false) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center font-sans pt-40 sm:pt-44 pb-16 px-6 bg-rose-50/20">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-rose-100 p-8 md:p-10 text-center space-y-4">
                    <h1 className="text-2xl font-serif text-text-dark">ბმული აღარ მოქმედია</h1>
                    <p className="text-text-mutted">
                        პაროლის აღდგენის ბმული ვადაგასულია ან უკვე გამოყენებულია. სცადე თავიდან.
                    </p>
                    <Link href="/auth/forgot-password" className="elegant-btn inline-flex">
                        ახალი ბმულის გამოგზავნა
                    </Link>
                </div>
            </div>
        );
    }

    if (done) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center font-sans pt-40 sm:pt-44 pb-16 px-6 bg-rose-50/20">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-rose-100 p-10 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <Check size={32} />
                    </div>
                    <h1 className="text-2xl font-serif text-text-dark">პაროლი შეცვლილია!</h1>
                    <p className="text-text-mutted">გადამისამართება...</p>
                </div>
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
                    <h1 className="text-3xl font-serif text-text-dark mb-2">ახალი პაროლი</h1>
                    <p className="text-text-mutted font-light">დააყენე ახალი პაროლი შენი ანგარიშისთვის.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-dark">ახალი პაროლი</label>
                        <div className="relative">
                            <Lock
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted"
                                size={18}
                            />
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                placeholder="••••••••"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-dark">გაიმეორე პაროლი</label>
                        <div className="relative">
                            <Lock
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted"
                                size={18}
                            />
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
                        disabled={loading || hasSession === null}
                        className="elegant-btn w-full py-3.5 shadow-md flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? "ინახება..." : <>შენახვა <ChevronRight size={18} /></>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
