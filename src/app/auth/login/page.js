"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ChevronRight } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const redirectTo = params.get("redirect") || "/comic";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const supabase = getSupabaseBrowser();
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            router.push(redirectTo);
            router.refresh();
        } catch (err) {
            setError(err.message || "ავტორიზაცია ვერ მოხერხდა");
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-rose-100 p-8 md:p-10"
        >
            <div className="text-center mb-10">
                <h1 className="text-3xl font-serif text-text-dark mb-2">ავტორიზაცია</h1>
                <p className="text-text-mutted font-light">შეიყვანეთ მონაცემები სისტემაში შესასვლელად</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-dark">ელ. ფოსტა</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted" size={18} />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-bg-light border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-base text-text-dark outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            placeholder="example@mail.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-text-dark">პაროლი</label>
                        <Link
                            href="/auth/forgot-password"
                            className="text-xs text-primary hover:underline"
                        >
                            დაგავიწყდათ?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-mutted" size={18} />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                    {loading ? "მუშავდება..." : <>შესვლა <ChevronRight size={18} /></>}
                </button>
            </form>

            <div className="mt-8 text-center text-sm text-text-mutted">
                არ გაქვთ ანგარიში?{" "}
                <Link href="/auth/register" className="text-primary font-medium hover:underline">
                    რეგისტრაცია
                </Link>
            </div>
        </motion.div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center font-sans pt-40 sm:pt-44 pb-16 px-6 bg-rose-50/20">
            <Suspense fallback={<div className="text-text-mutted">იტვირთება...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
