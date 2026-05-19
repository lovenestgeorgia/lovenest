import Link from "next/link";
import { requireAdmin } from "@/lib/admin/access";

export const metadata = {
    title: "Admin · Lovenest",
    robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
    const user = await requireAdmin();

    return (
        <div className="font-sans bg-bg-light min-h-screen relative">
            <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-rose-50/40 to-transparent pointer-events-none"
            />
            <header className="relative max-w-7xl mx-auto px-6 pt-28 sm:pt-32 pb-10">
                <div className="flex items-baseline justify-between gap-6 flex-wrap">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.32em] font-mono text-text-mutted/70">
                            Lovenest · Admin
                        </p>
                        <h1 className="font-serif text-4xl sm:text-5xl text-text-dark mt-2 leading-[0.95] tracking-tight">
                            დაშბორდი
                        </h1>
                    </div>
                    <div className="flex items-baseline gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-text-mutted/70">
                        <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {user.email}
                    </div>
                </div>

                <nav className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm border-b border-rose-100 pb-3">
                    <AdminNavLink href="/admin">მთავარი</AdminNavLink>
                    <AdminNavLink href="/admin/orders">შეკვეთები</AdminNavLink>
                    <AdminNavLink href="/admin/projects">პროექტები</AdminNavLink>
                </nav>
            </header>

            <main className="relative max-w-7xl mx-auto px-6 pb-24">{children}</main>
        </div>
    );
}

function AdminNavLink({ href, children }) {
    return (
        <Link
            href={href}
            className="text-text-mutted hover:text-primary transition-colors uppercase tracking-[0.18em] text-[12px] font-medium"
        >
            {children}
        </Link>
    );
}
