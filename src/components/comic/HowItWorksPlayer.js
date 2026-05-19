"use client";

import dynamic from "next/dynamic";

// Remotion Player ships browser-only code. Lazy-load it with no SSR so
// hydration can't mismatch, and so the marketing page doesn't bundle the
// player into the server build.
const LazyPlayer = dynamic(
    () =>
        import("./HowItWorksPlayerInner").then((m) => ({
            default: m.HowItWorksPlayerInner,
        })),
    {
        ssr: false,
        loading: () => (
            <div className="aspect-[16/9] w-full grid place-items-center bg-rose-50/40">
                <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] font-mono text-text-mutted">
                    <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    ანიმაცია იტვირთება
                </div>
            </div>
        ),
    }
);

export function HowItWorksPlayer() {
    return (
        <div className="relative w-full max-w-5xl mx-auto rounded-[2rem] overflow-hidden border border-rose-100 shadow-[0_30px_70px_-30px_rgba(138,31,59,0.28)] bg-bg-light">
            <LazyPlayer />
        </div>
    );
}
