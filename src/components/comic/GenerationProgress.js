"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle,
    AlertCircle,
    ArrowRight,
    RotateCcw,
    MessageSquare,
    Send,
    Sparkles,
    Type,
    X,
} from "lucide-react";
import { AiErrorModal } from "@/components/comic/AiErrorModal";

// Module-level guard so React strict-mode remounts don't double-POST.
// Exported so explicit "regenerate everything" flows can wipe the project
// entry before navigating back — otherwise the next mount silently skips
// the POST because this guard thinks generation is still in flight.
const startedProjects = new Set();
export function clearStartedFlag(projectId) {
    startedProjects.delete(projectId);
}

const FLAVOR_MESSAGES = [
    "ფანქარს ვალესავთ",
    "სცენებს ვაკომპონებთ",
    "ფერებს ვირჩევთ",
    "გრძნობებს ვაძლიერებთ",
    "კალამის შტრიხებს ვამატებთ",
    "ჩრდილებს ვსვამთ",
    "თვალებს ვლუსტრავთ",
    "შავი მელნით კონტურს ვხატავთ",
    "ბუშტებში სიტყვებს ვწერთ",
];

const PHASES = [
    { id: "scripting", label: "სცენარი" },
    { id: "stylizing", label: "სტილი" },
    { id: "drawing", label: "კადრები" },
    { id: "done", label: "მზადაა" },
];

export function GenerationProgress({ projectId, expectedCount, initialPanels, shouldStart }) {
    const router = useRouter();
    const [panels, setPanels] = useState(initialPanels);
    const [serverMessage, setServerMessage] = useState(null);
    const [phase, setPhase] = useState(() => derivePhase(initialPanels));
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [flavorIdx, setFlavorIdx] = useState(0);
    const [focusedId, setFocusedId] = useState(null);
    const [retryOpen, setRetryOpen] = useState(false);
    const [retryComment, setRetryComment] = useState("");
    const [regenerating, setRegenerating] = useState(false);
    const startedRef = useRef(false);
    const startTimeRef = useRef(Date.now());

    // Live elapsed ticker
    useEffect(() => {
        if (done) return;
        const id = setInterval(
            () => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)),
            1000
        );
        return () => clearInterval(id);
    }, [done]);

    // Flavor copy rotation (only when no panel is being actively drawn)
    useEffect(() => {
        if (done || phase === "drawing") return;
        const id = setInterval(() => setFlavorIdx((i) => (i + 1) % FLAVOR_MESSAGES.length), 2800);
        return () => clearInterval(id);
    }, [done, phase]);

    // Kick off SSE stream
    useEffect(() => {
        if (!shouldStart || startedRef.current || startedProjects.has(projectId)) return;
        startedRef.current = true;
        startedProjects.add(projectId);

        (async () => {
            try {
                const res = await fetch(`/api/comic/projects/${projectId}/generate`, {
                    method: "POST",
                });
                if (!res.ok) {
                    // Some errors are recoverable by sending the user to a different step
                    // instead of showing them an error modal they can't act on.
                    const text = await res.text().catch(() => "");
                    let parsed;
                    try {
                        parsed = JSON.parse(text);
                    } catch {}
                    if (parsed?.redirect) {
                        router.push(parsed.redirect);
                        return;
                    }
                    throw new Error(text || `HTTP ${res.status}`);
                }
                if (!res.body) throw new Error("No response stream");
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buf = "";
                while (true) {
                    const { value, done: streamDone } = await reader.read();
                    if (streamDone) break;
                    buf += decoder.decode(value, { stream: true });
                    const events = buf.split("\n\n");
                    buf = events.pop();
                    for (const ev of events) {
                        const line = ev.split("\n").find((l) => l.startsWith("data: "));
                        if (!line) continue;
                        try {
                            handleEvent(JSON.parse(line.slice(6)));
                        } catch {}
                    }
                }
            } catch (e) {
                if (e.name !== "AbortError") setError(e.message);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, shouldStart]);

    // Polling fallback for mid-flight re-entries
    useEffect(() => {
        if (shouldStart || done) return;
        const id = setInterval(async () => {
            try {
                const res = await fetch(`/api/comic/projects/${projectId}/panels`);
                const json = await res.json();
                if (json.panels) {
                    setPanels(json.panels);
                    setPhase(derivePhase(json.panels));
                    const allReady =
                        json.panels.length > 0 && json.panels.every((p) => p.status === "ready");
                    if (allReady) {
                        setDone(true);
                        setPhase("done");
                        clearInterval(id);
                    }
                }
            } catch {}
        }, 3000);
        return () => clearInterval(id);
    }, [projectId, shouldStart, done]);

    const handleEvent = (ev) => {
        switch (ev.type) {
            case "status":
                setServerMessage(ev.message);
                if (/სტილ|stylize/i.test(ev.message)) setPhase("stylizing");
                else if (/სცენარ|script/i.test(ev.message)) setPhase("scripting");
                break;
            case "script-ready":
                setPanels(
                    ev.panels.map((p) => ({
                        id: p.id,
                        ord: p.ord,
                        page_type: p.page_type,
                        caption: p.caption || "",
                        status: "pending",
                        image_url: null,
                        art_url: null,
                        stage: null,
                    }))
                );
                setServerMessage(null);
                setPhase("stylizing");
                break;
            case "panel-start":
                setPanels((ps) =>
                    ps.map((p) =>
                        p.id === ev.id
                            ? { ...p, status: "generating", art_url: null, stage: "drawing" }
                            : p
                    )
                );
                setPhase("drawing");
                break;
            case "panel-stage":
                // Server signals which sub-pass we're on, plus the provider
                // currently running (openai or gemini for drawing; gemini
                // always for writing).
                setPanels((ps) =>
                    ps.map((p) =>
                        p.id === ev.id
                            ? { ...p, stage: ev.stage, drawing_provider: ev.provider || p.drawing_provider }
                            : p
                    )
                );
                break;
            case "panel-art":
                // First-pass result: text-free art. Render it so the user can
                // watch Gemini add Georgian text on top.
                setPanels((ps) =>
                    ps.map((p) =>
                        p.id === ev.id
                            ? {
                                  ...p,
                                  art_url: ev.image_data_url,
                                  stage: "writing",
                                  drawing_provider: ev.provider || p.drawing_provider,
                              }
                            : p
                    )
                );
                break;
            case "panel-ready":
                setPanels((ps) =>
                    ps.map((p) =>
                        p.id === ev.id
                            ? {
                                  ...p,
                                  status: "ready",
                                  image_url: ev.image_url,
                                  art_url: null,
                                  stage: null,
                              }
                            : p
                    )
                );
                setPhase("drawing");
                break;
            case "panel-failed":
                setPanels((ps) =>
                    ps.map((p) => (p.id === ev.id ? { ...p, status: "failed" } : p))
                );
                break;
            case "done":
                setDone(true);
                setPhase("done");
                break;
            case "error":
                setError(ev.message);
                setPhase("error");
                break;
        }
    };

    // Auto-focus: the next not-yet-ready panel, falling back to the last ready one
    const autoFocused = useMemo(() => {
        const next = panels.find((p) => p.status !== "ready");
        const lastDone = [...panels].reverse().find((p) => p.status === "ready");
        return next || lastDone || null;
    }, [panels]);

    const focused = useMemo(() => {
        if (focusedId) {
            const explicit = panels.find((p) => p.id === focusedId);
            if (explicit) return explicit;
        }
        return autoFocused;
    }, [panels, focusedId, autoFocused]);

    const regeneratePanel = async (panelId, comment) => {
        setRegenerating(true);
        setRetryOpen(false);
        setPanels((ps) =>
            ps.map((p) =>
                p.id === panelId
                    ? { ...p, status: "generating", art_url: null, stage: "drawing" }
                    : p
            )
        );
        try {
            const res = await fetch(
                `/api/comic/projects/${projectId}/panels/${panelId}/regenerate`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ comment: comment || "" }),
                }
            );
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            setPanels((ps) =>
                ps.map((p) =>
                    p.id === panelId
                        ? {
                              ...p,
                              status: "ready",
                              image_url: json.image_url,
                              art_url: null,
                              stage: null,
                          }
                        : p
                )
            );
            setRetryComment("");
        } catch (e) {
            setPanels((ps) =>
                ps.map((p) => (p.id === panelId ? { ...p, status: "failed" } : p))
            );
            alert(`გენერაცია ვერ მოხერხდა: ${e.message}`);
        } finally {
            setRegenerating(false);
        }
    };

    const readyCount = panels.filter((p) => p.status === "ready").length;
    const failedCount = panels.filter((p) => p.status === "failed").length;
    const totalCount = panels.length || expectedCount;
    const pct = totalCount ? Math.round((readyCount / totalCount) * 100) : 0;
    // "Everything broke" recovery: server reported an error OR most panels failed.
    const allBroken = error || (failedCount > 0 && failedCount >= totalCount / 2);

    // Modal state — derived from error / panel failures
    const [errorModalDismissed, setErrorModalDismissed] = useState(false);
    const modalError = allBroken && !errorModalDismissed && !done
        ? {
              code:
                  /503|unavailable|high demand|overloaded/i.test(error || "")
                      ? "ai_unavailable"
                      : "generation_failed",
              detail: error || `${failedCount} კადრი ვერ შეიქმნა.`,
              primaryLabel: "სცადე თავიდან",
              onPrimary: async () => {
                  try {
                      await fetch(`/api/comic/projects/${projectId}/panels`, {
                          method: "DELETE",
                      });
                      window.location.reload();
                  } catch {}
              },
              secondaryLabel: "შეცვალე სტილი",
              onSecondary: () => router.push(`/comic/${projectId}/style`),
          }
        : null;

    const tilesToShow = panels.length
        ? panels
        : Array.from({ length: expectedCount }, (_, i) => ({
              id: `placeholder-${i}`,
              ord: i + 1,
              status: "queued",
          }));

    return (
        <div className="relative -mx-4 sm:-mx-6 md:-mx-8 -mt-8 px-6 pt-10 pb-12 rounded-3xl overflow-hidden">
            <PaperGrain />

            {/* Top utility row */}
            <div className="relative z-10 flex items-baseline justify-between text-xs uppercase tracking-[0.18em] mb-8">
                <span className="text-text-mutted/70 font-medium">lovenest · studio</span>
                <RegenerateAllLink projectId={projectId} />
            </div>

            {/* Phase ribbon */}
            <PhaseRibbon phase={phase} error={error} />

            {/* Hero statement */}
            <HeroStatement
                focused={focused}
                phase={phase}
                done={done}
                error={error}
                readyCount={readyCount}
                totalCount={totalCount}
                elapsed={elapsed}
                flavor={FLAVOR_MESSAGES[flavorIdx]}
                serverMessage={serverMessage}
                onView={() => router.push(`/comic/${projectId}/preview`)}
            />

            {/* Active panel showcase */}
            <div className="relative z-10 max-w-md mx-auto my-10">
                {phase === "scripting" && panels.length === 0 ? (
                    <ScriptingShowcase />
                ) : (
                    <>
                        <ActivePanelShowcase
                            panel={focused}
                            regenerating={regenerating}
                        />
                        {focused && (focused.status === "ready" || focused.status === "failed" || focused.status === "generating") && (
                            <PanelActions
                                panel={focused}
                                regenerating={regenerating}
                                retryOpen={retryOpen}
                                retryComment={retryComment}
                                onToggleRetry={() => setRetryOpen((v) => !v)}
                                onCommentChange={setRetryComment}
                                onRetry={(comment) => regeneratePanel(focused.id, comment)}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Filmstrip */}
            <Filmstrip
                panels={tilesToShow}
                focusedId={focused?.id}
                onFocus={(id) => setFocusedId(id)}
            />

            {/* Progress footer */}
            <ProgressFooter
                pct={pct}
                readyCount={readyCount}
                totalCount={totalCount}
            />

            {/* Error modal — same UX as the character upload AI error */}
            <AiErrorModal error={modalError} onClose={() => setErrorModalDismissed(true)} />
        </div>
    );
}

/* ───────────────────────── helpers ───────────────────────── */

function derivePhase(panels) {
    if (!panels || panels.length === 0) return "scripting";
    if (panels.every((p) => p.status === "ready")) return "done";
    if (panels.some((p) => p.status === "generating")) return "drawing";
    return "stylizing";
}

function formatElapsed(s) {
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
}

function pageLabel(p) {
    if (p?.page_type === "cover") return "ყდა";
    if (p?.page_type === "closing") return "დასასრული";
    return p ? `კადრი ${p.ord}` : "";
}

/* ───────────────────────── visuals ───────────────────────── */

function PaperGrain() {
    // SVG fractal noise, fixed via inline data URI so it ships with no extra request.
    return (
        <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-[0.045] mix-blend-multiply"
            style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.55 0 0 0 0 0.20 0 0 0 0 0.30 0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
            }}
        />
    );
}

function PhaseRibbon({ phase, error }) {
    return (
        <nav
            aria-label="Generation phase"
            className="relative z-10 flex items-center justify-center gap-6 sm:gap-12 mb-12 text-[11px] uppercase tracking-[0.22em]"
        >
            {PHASES.map((p, idx) => {
                const isCurrent = phase === p.id;
                const isPast = phaseIndex(phase) > idx;
                const isError = error && idx === phaseIndex(phase);
                return (
                    <div key={p.id} className="relative flex items-center gap-6 sm:gap-12">
                        <span
                            className={`relative transition-colors duration-300 ${
                                isError
                                    ? "text-red-600"
                                    : isCurrent
                                    ? "text-primary"
                                    : isPast
                                    ? "text-text-dark/80"
                                    : "text-text-mutted/40"
                            }`}
                        >
                            <span className="hidden sm:inline text-[10px] mr-2 font-mono">
                                {(idx + 1).toString().padStart(2, "0")}
                            </span>
                            {p.label}
                            {isCurrent && (
                                <motion.span
                                    layoutId="phase-underline"
                                    className="absolute -bottom-1.5 left-0 right-0 h-px bg-primary"
                                    transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                                />
                            )}
                        </span>
                        {idx < PHASES.length - 1 && (
                            <span className="text-text-mutted/30 select-none">·</span>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}

function phaseIndex(phase) {
    const i = PHASES.findIndex((p) => p.id === phase);
    return i === -1 ? 0 : i;
}

function HeroStatement({
    focused,
    phase,
    done,
    error,
    readyCount,
    totalCount,
    elapsed,
    flavor,
    serverMessage,
    onView,
}) {
    const showPanelLabel = phase === "drawing" || done;
    let primaryEl;
    let secondaryEl;

    if (error) {
        primaryEl = <span className="text-red-600">შეცდომა</span>;
        secondaryEl = error;
    } else if (done) {
        primaryEl = (
            <>
                კომიქსი <span className="italic text-primary">მზადაა</span>
            </>
        );
        secondaryEl = (
            <button
                onClick={onView}
                className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
            >
                გადახედვა <ArrowRight size={16} />
            </button>
        );
    } else if (showPanelLabel && focused) {
        primaryEl = (
            <>
                <span className="text-text-mutted/40 font-mono text-3xl sm:text-4xl mr-3">
                    {focused.ord.toString().padStart(2, "0")}
                </span>
                {pageLabel(focused)}
            </>
        );
        secondaryEl = focused.caption || flavor;
    } else if (phase === "scripting") {
        primaryEl = (
            <>
                სცენარს <span className="italic text-primary">ვწერთ</span>
            </>
        );
        secondaryEl = serverMessage || flavor;
    } else if (phase === "stylizing") {
        primaryEl = (
            <>
                პერსონაჟებს <span className="italic text-primary">ვამზადებთ</span>
            </>
        );
        secondaryEl = serverMessage || flavor;
    } else {
        primaryEl = "გენერაცია";
        secondaryEl = flavor;
    }

    return (
        <header className="relative z-10 text-center max-w-2xl mx-auto px-4 mb-2">
            <motion.h2
                key={typeof primaryEl === "string" ? primaryEl : focused?.id || phase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                className="font-serif text-4xl sm:text-5xl md:text-6xl text-text-dark leading-[1.05] tracking-tight"
            >
                {primaryEl}
            </motion.h2>

            <div className="h-6 mt-4 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={(secondaryEl || "") + (done ? "d" : "") + (error ? "e" : "")}
                        initial={{ y: 14, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -14, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                        className="text-sm md:text-base text-text-mutted font-light italic"
                    >
                        {secondaryEl}
                    </motion.p>
                </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-[10px] uppercase tracking-[0.22em] text-text-mutted/60 font-mono">
                <span>
                    {readyCount.toString().padStart(2, "0")} / {totalCount.toString().padStart(2, "0")}
                </span>
                <span aria-hidden>·</span>
                <span>{formatElapsed(elapsed)}</span>
            </div>
        </header>
    );
}

/* ───────── Scripting phase showcase ─────────
 * Three slightly rotated paper sheets stacked behind one another. The front
 * sheet animates Georgian "ink lines" writing themselves out — title bar
 * lands first, then body paragraphs draw in sequentially. A small ink-dot
 * cursor rides the leading edge of the line being written.
 */
const SCRIPT_LINES = [
    { y: 58, x1: 32, x2: 178, delay: 0.0 },
    { y: 78, x1: 32, x2: 148, delay: 0.35 },
    { y: 98, x1: 32, x2: 172, delay: 0.7 },
    { y: 118, x1: 32, x2: 108, delay: 1.05 },
    { y: 152, x1: 32, x2: 165, delay: 1.55 },
    { y: 172, x1: 32, x2: 138, delay: 1.9 },
    { y: 192, x1: 32, x2: 175, delay: 2.25 },
    { y: 212, x1: 32, x2: 96, delay: 2.6 },
    { y: 246, x1: 32, x2: 160, delay: 3.05 },
    { y: 266, x1: 32, x2: 124, delay: 3.4 },
];
const SCRIPT_CYCLE = 6.4; // seconds for a full write→pause→fade cycle

function ScriptingShowcase() {
    return (
        <div className="relative aspect-[2/3] w-full">
            {/* Drop shadow under the stack */}
            <div
                aria-hidden
                className="absolute -inset-4 rounded-[2rem] bg-gradient-to-b from-rose-100/0 via-rose-100/40 to-amber-50/30 blur-2xl -z-10"
            />

            {/* BACK sheet — tilted left */}
            <motion.div
                aria-hidden
                className="absolute inset-x-6 top-6 bottom-6 rounded-[1.5rem] bg-[oklch(94%_0.022_55)] border border-rose-100/60 shadow-[0_8px_20px_-12px_rgba(138,31,59,0.18)]"
                initial={{ rotate: -3.5, x: -6 }}
                animate={{ rotate: [-3.5, -3, -3.5], x: [-6, -4, -6] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* MIDDLE sheet — tilted right */}
            <motion.div
                aria-hidden
                className="absolute inset-x-5 top-4 bottom-4 rounded-[1.5rem] bg-[oklch(96%_0.018_60)] border border-rose-100/70 shadow-[0_10px_24px_-14px_rgba(138,31,59,0.22)]"
                initial={{ rotate: 2.5, x: 4 }}
                animate={{ rotate: [2.5, 3, 2.5], x: [4, 6, 4] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* FRONT sheet — the one being written on */}
            <div className="absolute inset-0 rounded-[1.75rem] overflow-hidden border border-rose-100/80 shadow-[0_30px_60px_-30px_rgba(138,31,59,0.28)] bg-[oklch(98%_0.014_60)]">
                {/* Subtle paper grain inside the sheet */}
                <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-multiply"
                    style={{
                        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.45 0 0 0 0 0.18 0 0 0 0 0.25 0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
                    }}
                />

                {/* Notebook margin line */}
                <div
                    aria-hidden
                    className="absolute top-8 bottom-8 left-[14%] w-px bg-primary/15"
                />

                {/* Title plate — fills in once, stays until the cycle restarts */}
                <motion.div
                    aria-hidden
                    className="absolute top-[10%] left-[18%] right-[10%]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{
                        duration: SCRIPT_CYCLE,
                        times: [0, 0.12, 0.85, 1],
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    <div className="h-[10px] w-[55%] bg-primary/60 rounded-[2px]" />
                    <div className="mt-2 h-[6px] w-[32%] bg-primary/25 rounded-[2px]" />
                </motion.div>

                {/* Animated writing lines */}
                <svg
                    viewBox="0 0 200 300"
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="none"
                >
                    {SCRIPT_LINES.map((l, i) => (
                        <motion.line
                            key={i}
                            x1={l.x1}
                            y1={l.y}
                            x2={l.x2}
                            y2={l.y}
                            stroke="oklch(32% 0.05 25 / 0.55)"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: [0, 0, 1, 1, 0] }}
                            transition={{
                                duration: SCRIPT_CYCLE,
                                times: [
                                    0,
                                    l.delay / SCRIPT_CYCLE,
                                    (l.delay + 0.55) / SCRIPT_CYCLE,
                                    0.85,
                                    1,
                                ],
                                repeat: Infinity,
                                ease: [0.2, 0.8, 0.2, 1],
                            }}
                        />
                    ))}
                </svg>

                {/* Pen-nib cursor — tiny dot pulsing on the most recently written line */}
                <ScriptingCursor />

                {/* Edge sweep — a faint warm light passes across as the AI "thinks" */}
                <motion.div
                    aria-hidden
                    className="absolute inset-y-0 w-1/3 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(90deg, transparent 0%, oklch(70% 0.12 30 / 0.08) 50%, transparent 100%)",
                    }}
                    initial={{ left: "-40%" }}
                    animate={{ left: ["-40%", "120%"] }}
                    transition={{
                        duration: SCRIPT_CYCLE,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </div>

            {/* Top-left tag */}
            <div className="absolute -top-3 left-6 px-3 py-0.5 bg-bg-light text-[10px] font-mono uppercase tracking-[0.22em] text-text-mutted">
                სცენარი
            </div>

            {/* Top-right "AI · writing" badge to match panel badges */}
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                className="absolute -top-3 right-6 inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-light border border-rose-100/80 text-[10px] font-mono uppercase tracking-[0.18em] text-text-mutted"
            >
                <Sparkles size={10} className="text-primary" />
                <span className="text-text-dark">AI</span>
                <span className="text-text-mutted/60">·</span>
                <span>დრაფტი</span>
            </motion.div>
        </div>
    );
}

function ScriptingCursor() {
    // The cursor lives at the rightmost end of whichever stroke is currently
    // being drawn. We re-key it to each segment so the position changes feel
    // discrete (like a pen jumping to the next line).
    return (
        <svg
            viewBox="0 0 200 300"
            aria-hidden
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
        >
            {SCRIPT_LINES.map((l, i) => (
                <motion.circle
                    key={i}
                    cx={l.x2}
                    cy={l.y}
                    r="1.6"
                    fill="oklch(45% 0.18 25)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 1, 0, 0] }}
                    transition={{
                        duration: SCRIPT_CYCLE,
                        times: [
                            0,
                            (l.delay + 0.5) / SCRIPT_CYCLE,
                            (l.delay + 0.55) / SCRIPT_CYCLE,
                            (l.delay + 0.65) / SCRIPT_CYCLE,
                            1,
                        ],
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            ))}
        </svg>
    );
}

function ActivePanelShowcase({ panel, regenerating }) {
    const status = regenerating ? "generating" : panel?.status || "pending";
    const isReady = status === "ready" && panel?.image_url;
    const isGenerating = status === "generating";
    const isFailed = status === "failed";
    const hasArtPreview = isGenerating && panel?.art_url;

    return (
        <div className="relative aspect-[2/3] w-full">
            {/* Subtle drop shadow on the underlying surface */}
            <div
                aria-hidden
                className="absolute -inset-4 rounded-[2rem] bg-gradient-to-b from-rose-100/0 via-rose-100/40 to-amber-50/30 blur-2xl -z-10"
            />

            {/* Paper frame */}
            <div className="absolute inset-0 rounded-[1.75rem] overflow-hidden border border-rose-100/80 shadow-[0_30px_60px_-30px_rgba(138,31,59,0.25)] bg-[oklch(98%_0.012_60)]">
                <AnimatePresence mode="wait">
                    {isReady ? (
                        <motion.img
                            key={`ready-${panel.id}-${panel.image_url}`}
                            src={panel.image_url}
                            alt={pageLabel(panel)}
                            initial={{ opacity: 0, scale: 1.04 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
                            className="w-full h-full object-cover"
                        />
                    ) : isFailed ? (
                        <FailedStage key="failed" />
                    ) : hasArtPreview ? (
                        <WritingStage key={`art-${panel.id}`} artUrl={panel.art_url} />
                    ) : isGenerating ? (
                        <DevelopingStage key="generating" />
                    ) : (
                        <PendingStage key="pending" ord={panel?.ord} />
                    )}
                </AnimatePresence>
            </div>

            {/* Corner ord marker — typeset, not a chip */}
            {panel && (
                <div className="absolute -top-3 left-6 px-3 py-0.5 bg-bg-light text-[10px] font-mono uppercase tracking-[0.22em] text-text-mutted">
                    №&nbsp;{panel.ord?.toString().padStart(2, "0")}
                </div>
            )}

            {/* Provider badge — surfaces which AI is currently working */}
            {isGenerating && (
                <ProviderBadge
                    stage={hasArtPreview ? "writing" : panel?.stage || "drawing"}
                    drawingProvider={panel?.drawing_provider}
                />
            )}
        </div>
    );
}

function providerLabel(provider) {
    if (provider === "openai") return "GPT";
    return "Gemini";
}

function ProviderBadge({ stage, drawingProvider }) {
    const isWriting = stage === "writing";
    return (
        <motion.div
            key={stage}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute -top-3 right-6 inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-light border border-rose-100/80 text-[10px] font-mono uppercase tracking-[0.18em] text-text-mutted"
        >
            {isWriting ? (
                <>
                    <Type size={10} className="text-primary" />
                    <span className="text-text-dark">Gemini</span>
                    <span className="text-text-mutted/60">·</span>
                    <span>ტექსტი</span>
                </>
            ) : (
                <>
                    <Sparkles size={10} className="text-primary" />
                    <span className="text-text-dark">{providerLabel(drawingProvider)}</span>
                    <span className="text-text-mutted/60">·</span>
                    <span>კადრი</span>
                </>
            )}
        </motion.div>
    );
}

function WritingStage({ artUrl }) {
    // The text-free OpenAI art lands here, and we overlay an animation
    // suggesting Gemini is writing Georgian text onto the panel.
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute inset-0"
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
                src={artUrl}
                alt=""
                initial={{ scale: 1.06, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Ink-wash that sweeps top→bottom suggesting text being written */}
            <motion.div
                aria-hidden
                className="absolute inset-x-0 h-24 pointer-events-none"
                style={{
                    background:
                        "linear-gradient(180deg, transparent 0%, oklch(99% 0.01 60 / 0.55) 45%, oklch(99% 0.01 60 / 0.85) 55%, transparent 100%)",
                    mixBlendMode: "screen",
                }}
                initial={{ top: "-25%" }}
                animate={{ top: ["-25%", "115%"] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Subtle scanning hairline — the "writing head" */}
            <motion.div
                aria-hidden
                className="absolute inset-x-0 h-px pointer-events-none bg-primary/40 shadow-[0_0_18px_2px_rgba(138,31,59,0.35)]"
                initial={{ top: "0%" }}
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Caption at base */}
            <div className="absolute bottom-5 inset-x-0 text-center text-[10px] uppercase tracking-[0.28em] text-white/90 font-mono drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
                <motion.span
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                    ტექსტი იწერება
                </motion.span>
            </div>
        </motion.div>
    );
}

function DevelopingStage() {
    // SVG "ink lines drawing themselves" — pure SVG, no images.
    // Three sketchy strokes appear at different speeds, looping.
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center"
        >
            {/* Faint paper tone */}
            <div
                aria-hidden
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(120% 80% at 50% 30%, oklch(96% 0.02 50) 0%, oklch(94% 0.025 45) 60%, oklch(91% 0.03 40) 100%)",
                }}
            />

            {/* Soft pulse glow at center */}
            <motion.div
                aria-hidden
                className="absolute w-2/3 h-2/3 rounded-full"
                style={{
                    background:
                        "radial-gradient(closest-side, oklch(70% 0.12 10 / 0.18), transparent 70%)",
                }}
                animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Animated ink strokes */}
            <svg
                viewBox="0 0 200 300"
                className="relative w-3/4 h-3/4 stroke-primary/55"
                fill="none"
                strokeWidth="1.5"
                strokeLinecap="round"
            >
                <motion.path
                    d="M30 140 Q70 90 110 130 T180 120"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 1, 1, 0] }}
                    transition={{
                        duration: 3.2,
                        times: [0, 0.45, 0.85, 1],
                        repeat: Infinity,
                        ease: [0.2, 0.8, 0.2, 1],
                    }}
                />
                <motion.path
                    d="M40 170 C80 200 130 200 170 175"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 1, 1, 0] }}
                    transition={{
                        duration: 3.2,
                        delay: 0.3,
                        times: [0, 0.45, 0.85, 1],
                        repeat: Infinity,
                        ease: [0.2, 0.8, 0.2, 1],
                    }}
                />
                <motion.path
                    d="M55 220 Q100 250 150 215"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: [0, 1, 1, 0] }}
                    transition={{
                        duration: 3.2,
                        delay: 0.6,
                        times: [0, 0.45, 0.85, 1],
                        repeat: Infinity,
                        ease: [0.2, 0.8, 0.2, 1],
                    }}
                />
            </svg>

            {/* Caption under the stage */}
            <div className="absolute bottom-5 inset-x-0 text-center text-[10px] uppercase tracking-[0.28em] text-primary/70 font-mono">
                <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                    კადრი იხატება
                </motion.span>
            </div>
        </motion.div>
    );
}

function PendingStage({ ord }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
        >
            <div
                aria-hidden
                className="absolute inset-0"
                style={{
                    background: "oklch(97% 0.012 55)",
                }}
            />
            <span className="relative font-serif text-7xl text-rose-200/70 select-none">
                {ord ? ord.toString().padStart(2, "0") : "—"}
            </span>
        </motion.div>
    );
}

function FailedStage() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/40 text-red-700 gap-2"
        >
            <AlertCircle size={32} />
            <span className="text-xs uppercase tracking-[0.22em] font-mono">ვერ მოხერხდა</span>
            <span className="text-xs text-red-600/80">ცადე ხელახლა</span>
        </motion.div>
    );
}

function PanelActions({
    panel,
    regenerating,
    retryOpen,
    retryComment,
    onToggleRetry,
    onCommentChange,
    onRetry,
}) {
    return (
        <div className="mt-5 space-y-3">
            <div className="flex items-center justify-center gap-2">
                <button
                    onClick={() => onRetry("")}
                    disabled={regenerating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] font-medium text-text-dark hover:text-primary transition-colors disabled:opacity-40"
                >
                    <RotateCcw size={12} /> ხელახლა
                </button>
                <span className="text-text-mutted/30">·</span>
                <button
                    onClick={onToggleRetry}
                    disabled={regenerating}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] font-medium transition-colors disabled:opacity-40 ${
                        retryOpen ? "text-primary" : "text-text-dark hover:text-primary"
                    }`}
                >
                    <MessageSquare size={12} /> შენიშვნით
                </button>
            </div>

            <AnimatePresence>
                {retryOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white/60 backdrop-blur-sm border border-rose-100 rounded-2xl p-3 space-y-2">
                            <textarea
                                value={retryComment}
                                onChange={(e) => onCommentChange(e.target.value)}
                                rows={2}
                                autoFocus
                                placeholder="რა გავასწოროთ?"
                                className="w-full bg-transparent text-sm text-text-dark outline-none resize-none placeholder:text-text-mutted/60"
                            />
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-100/60">
                                <button
                                    onClick={onToggleRetry}
                                    className="text-[11px] uppercase tracking-[0.18em] text-text-mutted hover:text-text-dark"
                                >
                                    გაუქმება
                                </button>
                                <button
                                    onClick={() => onRetry(retryComment)}
                                    disabled={regenerating || !retryComment.trim()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] font-semibold text-primary disabled:opacity-30"
                                >
                                    <Send size={12} /> გადახატე
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Filmstrip({ panels, focusedId, onFocus }) {
    return (
        <div className="relative z-10 mt-10 -mx-2 px-2 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 sm:gap-3 justify-center min-w-fit pb-2">
                {panels.map((p) => (
                    <FilmFrame
                        key={p.id}
                        panel={p}
                        focused={p.id === focusedId}
                        onClick={() => onFocus(p.id)}
                    />
                ))}
            </div>
        </div>
    );
}

function FilmFrame({ panel, focused, onClick }) {
    const isReady = panel.status === "ready" && panel.image_url;
    const isGenerating = panel.status === "generating";
    const isFailed = panel.status === "failed";

    return (
        <button
            onClick={onClick}
            aria-label={pageLabel(panel)}
            className={`relative shrink-0 w-12 h-16 sm:w-14 sm:h-20 rounded-lg overflow-hidden border transition-all ${
                focused
                    ? "border-primary ring-2 ring-primary/20 scale-105"
                    : "border-rose-100/60 opacity-70 hover:opacity-100"
            }`}
        >
            {isReady ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={panel.image_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />
            ) : isFailed ? (
                <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-500">
                    <AlertCircle size={12} />
                </div>
            ) : isGenerating ? (
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-amber-50/60">
                    <motion.div
                        aria-hidden
                        className="absolute -inset-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent rotate-12"
                        animate={{ x: ["-50%", "150%"] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            ) : (
                <div className="absolute inset-0 bg-rose-50/40 flex items-center justify-center text-rose-200 text-[10px] font-mono">
                    {panel.ord?.toString().padStart(2, "0")}
                </div>
            )}
        </button>
    );
}

function ProgressFooter({ pct, readyCount, totalCount }) {
    return (
        <div className="relative z-10 mt-8 max-w-md mx-auto">
            <div className="relative h-px bg-rose-100">
                <motion.div
                    className="absolute inset-y-0 left-0 bg-primary"
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                />
            </div>
            <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[0.22em] text-text-mutted/70 font-mono">
                <span>
                    {readyCount.toString().padStart(2, "0")} of {totalCount.toString().padStart(2, "0")}
                </span>
                <span>{pct}%</span>
            </div>
        </div>
    );
}

function RegenerateAllLink({ projectId }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const doIt = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/comic/projects/${projectId}/panels`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed");
            // Full reload — wipes module-level startedProjects guard and any
            // stale per-component refs so the fresh mount triggers a new
            // POST /generate. Without this, the guard skips re-running.
            clearStartedFlag(projectId);
            window.location.href = `/comic/${projectId}/generate`;
        } catch {
            setLoading(false);
        }
    };

    if (confirming) {
        return (
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em]">
                <span className="text-text-mutted">თავიდან?</span>
                <button
                    onClick={doIt}
                    disabled={loading}
                    className="text-primary font-semibold hover:text-rose-700"
                >
                    {loading ? "..." : "კი"}
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    className="text-text-mutted hover:text-text-dark"
                >
                    არა
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="text-text-mutted/70 hover:text-primary transition-colors font-medium"
        >
            ხელახლა გენერაცია
        </button>
    );
}
