// Shared chrome for the comic studio surface — paper grain background and the
// typographic step ribbon used across every wizard page. Visuals match the
// generation page's design language so the whole flow feels of-a-piece.

import {
    Check,
    MessageCircle,
    Users,
    Palette,
    Wand2,
    Eye,
    CreditCard,
} from "lucide-react";

const STEP_ICONS = {
    story: MessageCircle,
    characters: Users,
    style: Palette,
    generate: Wand2,
    preview: Eye,
    checkout: CreditCard,
};

export function PaperGrain({ className = "" }) {
    return (
        <div
            aria-hidden
            className={`pointer-events-none opacity-[0.04] mix-blend-multiply ${className}`}
            style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.55 0 0 0 0 0.20 0 0 0 0 0.30 0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
            }}
        />
    );
}

export function StepRibbon({ steps, currentIdx }) {
    return (
        <nav
            aria-label="Comic creation progress"
            className="relative w-full overflow-x-auto scrollbar-hide -mx-2 sm:mx-0"
        >
            <ol className="flex items-start justify-center min-w-fit px-2 pb-1">
                {steps.map((s, idx) => {
                    const done = idx < currentIdx;
                    const active = idx === currentIdx;
                    const Icon = STEP_ICONS[s.id] || MessageCircle;
                    return (
                        <li key={s.id} className="flex items-start shrink-0">
                            <div className="flex flex-col items-center gap-2.5 w-[68px] sm:w-[88px]">
                                {/* Node */}
                                <div className="relative">
                                    {/* Pulsing halo for the active node */}
                                    {active && (
                                        <span
                                            aria-hidden
                                            className="absolute inset-0 rounded-full bg-primary/25 blur-md animate-pulse"
                                        />
                                    )}
                                    <div
                                        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                            done
                                                ? "bg-primary text-white"
                                                : active
                                                ? "bg-primary text-white shadow-[0_10px_22px_-10px_oklch(38%_0.13_0_/_0.55)] scale-105"
                                                : "bg-white text-text-mutted/40 border border-rose-100"
                                        }`}
                                    >
                                        {done ? (
                                            <Check size={16} strokeWidth={2.5} />
                                        ) : (
                                            <Icon
                                                size={16}
                                                strokeWidth={active ? 2 : 1.5}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Labels */}
                                <div className="flex flex-col items-center gap-0.5">
                                    <span
                                        className={`font-mono text-[9px] tracking-[0.18em] tabular-nums transition-colors ${
                                            active || done
                                                ? "text-primary/70"
                                                : "text-text-mutted/40"
                                        }`}
                                    >
                                        {(idx + 1).toString().padStart(2, "0")}
                                    </span>
                                    <span
                                        className={`text-[10px] uppercase tracking-[0.18em] font-medium leading-tight text-center transition-colors ${
                                            active
                                                ? "text-primary"
                                                : done
                                                ? "text-text-dark/70"
                                                : "text-text-mutted/45"
                                        }`}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                            </div>

                            {/* Connector — fills primary when the segment before it is done */}
                            {idx < steps.length - 1 && (
                                <div
                                    aria-hidden
                                    className="relative h-px shrink-0 mt-5 w-6 sm:w-10 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-rose-100/70" />
                                    <div
                                        className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-500 ease-out"
                                        style={{ width: done ? "100%" : "0%" }}
                                    />
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

// Standard surface wrapper for non-generate steps. Lighter than the old
// "white card with chunky shadow" — feels like a hand-tooled sheet of paper.
export function StudioSheet({ children, className = "" }) {
    return (
        <section
            className={`relative bg-white/70 backdrop-blur-[2px] rounded-[2rem] border border-rose-100/80 shadow-[0_20px_50px_-30px_rgba(138,31,59,0.18)] ${className}`}
        >
            {children}
        </section>
    );
}

// Big serif page heading used everywhere. Pass `accent` to italicize one word.
export function StudioHeading({ children, accent, eyebrow, className = "" }) {
    return (
        <header className={`text-center max-w-2xl mx-auto ${className}`}>
            {eyebrow && (
                <p className="text-[10px] uppercase tracking-[0.28em] text-text-mutted/70 font-mono mb-3">
                    {eyebrow}
                </p>
            )}
            <h1 className="font-serif text-4xl sm:text-5xl text-text-dark leading-[1.05] tracking-tight">
                {children}
                {accent && <> <span className="italic text-primary">{accent}</span></>}
            </h1>
        </header>
    );
}
