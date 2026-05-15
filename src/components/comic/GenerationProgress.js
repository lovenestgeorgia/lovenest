"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wand2,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Sparkles,
    PenTool,
    Palette,
    Brush,
    Heart,
    RotateCcw,
    MessageSquare,
    Send,
} from "lucide-react";

// Module-level guard so React strict-mode remounts don't trigger duplicate POSTs.
const startedProjects = new Set();

// Rotating flavor copy shown under the main status while we wait.
// Picked to feel like a craftsperson at work, not a server log.
const FLAVOR_MESSAGES = [
    "ფანქარს ვალესავთ...",
    "სცენებს ვაკომპონებთ...",
    "სიყვარულს ვამატებთ...",
    "ფერებს ვირჩევთ...",
    "გრძნობებს ვაძლიერებთ...",
    "კალამის შტრიხებს ვამატებთ...",
    "სვამთ ჩრდილებს...",
    "ვლუსტრავთ თვალებს...",
    "ხანდახან გვერდს ვამთავრებთ...",
    "ხელით ვადგენთ კომპოზიციას...",
    "შავი მელნით ვხატავთ კონტურს...",
    "ბუშტებში ვწერთ სიტყვებს...",
];

const PHASE_ICONS = {
    scripting: PenTool,
    stylizing: Palette,
    drawing: Brush,
    done: CheckCircle,
    error: AlertCircle,
};

export function GenerationProgress({ projectId, expectedCount, initialPanels, shouldStart }) {
    const router = useRouter();
    const [panels, setPanels] = useState(initialPanels);
    const [serverMessage, setServerMessage] = useState(
        shouldStart ? "გენერაცია იწყება..." : "მიმდინარეობს..."
    );
    const [phase, setPhase] = useState(() => derivePhase(initialPanels));
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [flavorIdx, setFlavorIdx] = useState(0);
    const [retryOpen, setRetryOpen] = useState({});
    const [retryComment, setRetryComment] = useState({});
    const startedRef = useRef(false);
    const startTimeRef = useRef(Date.now());

    // Elapsed-time ticker
    useEffect(() => {
        if (done) return;
        const id = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [done]);

    // Rotating flavor copy
    useEffect(() => {
        if (done) return;
        const id = setInterval(() => {
            setFlavorIdx((i) => (i + 1) % FLAVOR_MESSAGES.length);
        }, 2600);
        return () => clearInterval(id);
    }, [done]);

    // Kick off streaming generation
    useEffect(() => {
        if (!shouldStart || startedRef.current || startedProjects.has(projectId)) return;
        startedRef.current = true;
        startedProjects.add(projectId);

        (async () => {
            try {
                const res = await fetch(`/api/comic/projects/${projectId}/generate`, {
                    method: "POST",
                });
                if (!res.ok || !res.body) throw new Error("Failed to start generation");

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buf = "";
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
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

    // Polling fallback when we re-enter the page mid-generation
    useEffect(() => {
        if (shouldStart || done) return;
        const interval = setInterval(async () => {
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
                        clearInterval(interval);
                    }
                }
            } catch {}
        }, 3000);
        return () => clearInterval(interval);
    }, [projectId, shouldStart, done]);

    const regeneratePanel = async (panelId, comment) => {
        setRetryOpen((o) => ({ ...o, [panelId]: false }));
        setPanels((ps) =>
            ps.map((p) => (p.id === panelId ? { ...p, status: "generating" } : p))
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
                        ? { ...p, status: "ready", image_url: json.image_url }
                        : p
                )
            );
            setRetryComment((c) => ({ ...c, [panelId]: "" }));
        } catch (e) {
            setPanels((ps) =>
                ps.map((p) => (p.id === panelId ? { ...p, status: "ready" } : p))
            );
            alert(`გენერაცია ვერ მოხერხდა: ${e.message}`);
        }
    };

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
                        status: "pending",
                        image_url: null,
                    }))
                );
                setServerMessage(`სცენარი მზადაა — ${ev.panels.length} გვერდი.`);
                setPhase("stylizing");
                break;
            case "panel-start":
                setPanels((ps) =>
                    ps.map((p) => (p.id === ev.id ? { ...p, status: "generating" } : p))
                );
                setPhase("drawing");
                break;
            case "panel-ready":
                setPanels((ps) =>
                    ps.map((p) =>
                        p.id === ev.id ? { ...p, status: "ready", image_url: ev.image_url } : p
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

    const readyCount = panels.filter((p) => p.status === "ready").length;
    const totalCount = panels.length || expectedCount;
    const pct = totalCount ? Math.round((readyCount / totalCount) * 100) : 0;

    const PhaseIcon = PHASE_ICONS[phase] || Wand2;
    const phaseLabel = useMemo(() => {
        if (error) return "შეცდომა";
        if (done) return "მზადაა!";
        if (phase === "scripting") return "ვწერთ სცენარს";
        if (phase === "stylizing") return "ვამზადებთ პერსონაჟებს";
        if (phase === "drawing") return "ვხატავთ კადრებს";
        return "გენერაცია";
    }, [phase, done, error]);

    const tilesToShow = panels.length
        ? panels
        : Array.from({ length: expectedCount }, (_, i) => ({
              id: `placeholder-${i}`,
              ord: i + 1,
              status: "queued",
          }));

    return (
        <div className="relative space-y-6">
            {/* Drifting sparkle particles */}
            <FloatingSparkles active={!done && !error} />

            {/* Phase header card */}
            <motion.div
                layout
                className="relative bg-gradient-to-br from-rose-50 via-white to-amber-50/40 border border-rose-100 rounded-3xl p-6 overflow-hidden"
            >
                {/* Subtle pulsing radial glow behind icon */}
                <motion.div
                    aria-hidden
                    className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="relative flex items-start gap-5">
                    {/* Big animated icon */}
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 rounded-2xl bg-primary/15 blur-xl" />
                        <motion.div
                            animate={
                                done
                                    ? { scale: 1 }
                                    : { rotate: [0, -8, 8, -4, 0] }
                            }
                            transition={
                                done
                                    ? {}
                                    : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                            }
                            className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                                error
                                    ? "bg-red-500"
                                    : done
                                    ? "bg-green-500"
                                    : "bg-gradient-to-br from-primary to-rose-600"
                            }`}
                        >
                            <PhaseIcon size={26} />
                            {/* Orbiting heart */}
                            {!done && !error && (
                                <motion.div
                                    aria-hidden
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-[-12px] rounded-full"
                                >
                                    <Heart
                                        size={12}
                                        className="absolute -top-1 left-1/2 -translate-x-1/2 text-primary fill-current"
                                    />
                                </motion.div>
                            )}
                        </motion.div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <h3 className="font-serif text-2xl text-text-dark">{phaseLabel}</h3>
                            {!done && !error && (
                                <span className="text-xs text-text-mutted font-mono">
                                    {formatElapsed(elapsed)}
                                </span>
                            )}
                        </div>

                        {/* Rotating flavor / server message */}
                        <div className="h-5 mt-1 overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={(serverMessage || "") + flavorIdx + phase}
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -10, opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    className="text-sm text-text-mutted truncate"
                                >
                                    {error
                                        ? error
                                        : done
                                        ? "ყველა გვერდი მზადაა — გადახედე!"
                                        : serverMessage && !/^მიმდინარეობს|^გენერაცია იწყება/.test(serverMessage)
                                        ? serverMessage
                                        : FLAVOR_MESSAGES[flavorIdx]}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        {/* Progress bar with shimmer */}
                        <div className="relative mt-4 h-2.5 bg-white/80 rounded-full overflow-hidden border border-rose-100">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-400 via-primary to-rose-500 rounded-full"
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                            {!done && !error && (
                                <motion.div
                                    aria-hidden
                                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                                    animate={{ x: ["-100%", "300%"] }}
                                    transition={{
                                        duration: 1.6,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                    style={{ mixBlendMode: "overlay" }}
                                />
                            )}
                        </div>
                        <p className="text-xs text-text-mutted mt-2 tabular-nums">
                            {readyCount} / {totalCount} გვერდი მზადაა · {pct}%
                        </p>
                    </div>

                    {done && (
                        <motion.button
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={() => router.push(`/comic/${projectId}/preview`)}
                            className="elegant-btn inline-flex items-center gap-2 self-center"
                        >
                            გადახედვა <ArrowRight size={16} />
                        </motion.button>
                    )}
                </div>
            </motion.div>

            {/* Panel grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {tilesToShow.map((p, idx) => (
                    <PanelTile
                        key={p.id}
                        panel={p}
                        stagger={idx}
                        retryOpen={!!retryOpen[p.id]}
                        retryComment={retryComment[p.id] || ""}
                        onToggleRetry={() =>
                            setRetryOpen((o) => ({ ...o, [p.id]: !o[p.id] }))
                        }
                        onCommentChange={(v) =>
                            setRetryComment((c) => ({ ...c, [p.id]: v }))
                        }
                        onRetry={(comment) => regeneratePanel(p.id, comment)}
                    />
                ))}
            </div>
        </div>
    );
}

// ---------- Helpers ----------

function derivePhase(panels) {
    if (!panels || panels.length === 0) return "scripting";
    if (panels.every((p) => p.status === "ready")) return "done";
    if (panels.some((p) => p.status === "generating")) return "drawing";
    return "stylizing";
}

function formatElapsed(s) {
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return m > 0 ? `${m}:${rem.toString().padStart(2, "0")}` : `${rem}s`;
}

function PanelTile({
    panel,
    stagger,
    retryOpen,
    retryComment,
    onToggleRetry,
    onCommentChange,
    onRetry,
}) {
    const isReady = panel.status === "ready" && panel.image_url;
    const isGenerating = panel.status === "generating";
    const isFailed = panel.status === "failed";
    const showRetryButtons = isReady;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(stagger * 0.05, 0.4), duration: 0.4 }}
            className={`group relative rounded-2xl overflow-hidden border ${
                isGenerating
                    ? "border-primary shadow-lg shadow-primary/20"
                    : isReady
                    ? "border-rose-100"
                    : "border-rose-100/60"
            } bg-rose-50/30`}
        >
            <div className="relative aspect-[2/3]">
                {/* Ord chip */}
                <span className="absolute top-2 left-2 z-20 bg-white/90 backdrop-blur-sm text-text-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {panel.page_type === "cover"
                        ? "ყდა"
                        : panel.page_type === "closing"
                        ? "დასასრული"
                        : panel.ord}
                </span>

                {/* Retry buttons — only on ready panels */}
                {showRetryButtons && onRetry && (
                    <div className="absolute top-2 right-2 z-20 flex gap-1">
                        <button
                            onClick={() => onRetry("")}
                            className="bg-white/95 hover:bg-white px-2 py-1 rounded-full text-text-dark shadow-md text-[10px] font-semibold inline-flex items-center gap-1 transition-all hover:scale-105"
                            title="ხელახლა"
                        >
                            <RotateCcw size={10} /> ხელახლა
                        </button>
                        <button
                            onClick={onToggleRetry}
                            className={`px-2 py-1 rounded-full shadow-md text-[10px] font-semibold inline-flex items-center gap-1 transition-all hover:scale-105 ${
                                retryOpen
                                    ? "bg-primary text-white"
                                    : "bg-white/95 hover:bg-white text-text-dark"
                            }`}
                            title="ხელახლა შენიშვნით"
                        >
                            <MessageSquare size={10} /> შენიშვნა
                        </button>
                    </div>
                )}

                {/* Active ring for the panel currently being drawn */}
                {isGenerating && (
                    <motion.div
                        aria-hidden
                        className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                        animate={{
                            boxShadow: [
                                "0 0 0 0px rgba(138, 31, 59, 0.3)",
                                "0 0 0 8px rgba(138, 31, 59, 0)",
                            ],
                        }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                    />
                )}

                <AnimatePresence>
                    {isReady ? (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0, scale: 1.08 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                            className="absolute inset-0"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={panel.image_url}
                                alt={`Panel ${panel.ord}`}
                                className="w-full h-full object-cover"
                            />
                            <RevealSparkles />
                        </motion.div>
                    ) : isFailed ? (
                        <motion.div
                            key="failed"
                            animate={{ x: [0, -4, 4, -2, 2, 0] }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-red-50/30 text-xs gap-2"
                        >
                            <AlertCircle size={24} />
                            <span>ვერ მოხერხდა</span>
                        </motion.div>
                    ) : isGenerating ? (
                        <DrawingSkeleton key="generating" />
                    ) : (
                        <PendingSkeleton key="pending" />
                    )}
                </AnimatePresence>
            </div>

            {/* Retry-with-comment textarea — appears below the image */}
            {retryOpen && isReady && (
                <div className="bg-rose-50/60 border-t border-rose-100 p-2.5 space-y-2">
                    <textarea
                        value={retryComment}
                        onChange={(e) => onCommentChange(e.target.value)}
                        rows={2}
                        autoFocus
                        placeholder="რა გავასწოროთ?"
                        className="w-full bg-white border border-rose-100 rounded-lg px-2.5 py-1.5 text-[11px] outline-none focus:border-primary resize-none"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => onRetry(retryComment)}
                            disabled={!(retryComment || "").trim()}
                            className="elegant-btn text-[10px] py-1 px-2.5 inline-flex items-center gap-1 disabled:opacity-40"
                        >
                            <Send size={10} /> გადახატე
                        </button>
                        <button
                            onClick={onToggleRetry}
                            className="text-[10px] text-text-mutted hover:text-text-dark"
                        >
                            გაუქმება
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// Pulsing gradient skeleton for queued/pending panels
function PendingSkeleton() {
    return (
        <motion.div
            className="absolute inset-0 bg-gradient-to-br from-rose-100/40 via-amber-50/30 to-rose-100/40"
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
            <div className="absolute inset-0 flex items-center justify-center text-primary/20">
                <Sparkles size={28} />
            </div>
        </motion.div>
    );
}

// "Being drawn" skeleton — moving shimmer + animated brush stroke
function DrawingSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-rose-50 to-amber-50/60 overflow-hidden"
        >
            {/* Diagonal shimmer */}
            <motion.div
                aria-hidden
                className="absolute -inset-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent rotate-12"
                animate={{ x: ["-50%", "50%"] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />

            {/* Brush + sparkle in the middle */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <motion.div
                    animate={{
                        rotate: [-10, 10, -10],
                        y: [0, -3, 0],
                    }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    className="w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-primary"
                >
                    <Brush size={20} />
                </motion.div>
                <motion.div
                    className="text-[10px] uppercase tracking-widest font-bold text-primary/70"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                    იხატება...
                </motion.div>
            </div>

            {/* Bottom "drawing" line that fills horizontally */}
            <motion.div
                aria-hidden
                className="absolute bottom-3 left-3 right-3 h-1 bg-primary/30 rounded-full origin-left"
                animate={{ scaleX: [0, 1, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
        </motion.div>
    );
}

// Brief sparkle burst when a panel is revealed
function RevealSparkles() {
    const sparkles = Array.from({ length: 6 });
    return (
        <div className="absolute inset-0 pointer-events-none">
            {sparkles.map((_, i) => {
                const angle = (i / sparkles.length) * Math.PI * 2;
                const dx = Math.cos(angle) * 60;
                const dy = Math.sin(angle) * 60;
                return (
                    <motion.div
                        key={i}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
                        animate={{ x: dx, y: dy, opacity: 0, scale: 1.2 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-300"
                    >
                        <Sparkles size={14} />
                    </motion.div>
                );
            })}
        </div>
    );
}

// Slow drifting sparkles behind the whole page during active generation
function FloatingSparkles({ active }) {
    const particles = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                delay: Math.random() * 4,
                duration: 8 + Math.random() * 6,
                size: 8 + Math.random() * 10,
            })),
        []
    );
    if (!active) return null;
    return (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ y: "110%", opacity: 0 }}
                    animate={{ y: "-10%", opacity: [0, 0.6, 0] }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    style={{ left: `${p.x}%` }}
                    className="absolute text-rose-300/60"
                >
                    <Sparkles size={p.size} />
                </motion.div>
            ))}
        </div>
    );
}
