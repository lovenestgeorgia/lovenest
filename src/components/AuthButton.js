"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function AuthButton({ collapsed = false }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = getSupabaseBrowser();
        let mounted = true;

        supabase.auth.getUser().then(({ data }) => {
            if (mounted) {
                setUser(data.user || null);
                setLoading(false);
            }
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    if (loading) return null;

    if (!user) {
        return (
            <Link
                href="/auth/login"
                className="p-2 text-text-mutted hover:text-primary transition-colors"
                aria-label="Login"
            >
                <LogIn size={20} />
            </Link>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <Link
                href="/comic"
                className="text-xs font-medium text-text-mutted hover:text-primary transition-colors hidden sm:inline"
            >
                ჩემი კომიქსები
            </Link>
            <form action="/auth/signout" method="post">
                <button
                    type="submit"
                    className="p-2 text-text-mutted hover:text-primary transition-colors"
                    aria-label="Sign out"
                >
                    <LogOut size={20} />
                </button>
            </form>
        </div>
    );
}
