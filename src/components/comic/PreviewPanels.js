"use client";

import { useState } from "react";
import {
    RotateCcw,
    Pencil,
    Check,
    X,
    MessageSquare,
    Send,
    Sparkles,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

export function PreviewPanels({ projectId, initialPanels, watermark }) {
    const [panels, setPanels] = useState(initialPanels);
    const [editing, setEditing] = useState(null);
    const [editDraft, setEditDraft] = useState("");
    const [regenerating, setRegenerating] = useState({});
    const [retryOpen, setRetryOpen] = useState({}); // panelId -> bool
    const [retryComment, setRetryComment] = useState({}); // panelId -> string

    const saveCaption = async (panelId) => {
        const draft = editDraft;
        setPanels((ps) => ps.map((p) => (p.id === panelId ? { ...p, caption: draft } : p)));
        setEditing(null);
        await fetch(`/api/comic/projects/${projectId}/panels/${panelId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ caption: draft }),
        });
    };

    const regenerate = async (panelId, comment) => {
        setRegenerating((r) => ({ ...r, [panelId]: true }));
        setRetryOpen((o) => ({ ...o, [panelId]: false }));
        setPanels((ps) => ps.map((p) => (p.id === panelId ? { ...p, status: "generating" } : p)));
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
        } finally {
            setRegenerating((r) => ({ ...r, [panelId]: false }));
        }
    };

    const pageTypeLabel = (t) => {
        if (t === "cover") return "ყდა";
        if (t === "closing") return "დასასრული";
        return null;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {panels.map((p) => (
                <div
                    key={p.id}
                    className={`bg-rose-50/20 rounded-2xl border overflow-hidden flex flex-col ${
                        p.page_type === "cover" || p.page_type === "closing"
                            ? "border-primary/40 ring-2 ring-primary/10"
                            : "border-rose-100"
                    }`}
                >
                    <div className="aspect-[2/3] relative bg-rose-50/40">
                        {p.image_url && p.status === "ready" ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.image_url} alt={`Panel ${p.ord}`} className="w-full h-full object-cover" />
                                {watermark && (
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none">
                                        <span className="text-white/50 text-3xl font-serif rotate-[-20deg] tracking-widest drop-shadow-lg">
                                            PREVIEW
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : p.status === "generating" || regenerating[p.id] ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-text-mutted text-sm">
                                ვერ მოხერხდა
                            </div>
                        )}
                        <span className="absolute top-2 left-2 bg-white/90 text-text-dark text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {pageTypeLabel(p.page_type) || `კადრი ${p.ord}`}
                        </span>
                        {(p.status === "ready" || p.status === "failed" || p.status === "generating") && (
                            <div className="absolute top-2 right-2 flex gap-1.5">
                                <button
                                    onClick={() => regenerate(p.id)}
                                    disabled={regenerating[p.id]}
                                    className="bg-white/95 hover:bg-white px-2.5 py-1.5 rounded-full text-text-dark shadow-md text-[11px] font-semibold inline-flex items-center gap-1 transition-all hover:scale-105 disabled:opacity-50"
                                    title="ხელახლა (იგივე ისტორიით)"
                                >
                                    <RotateCcw size={12} /> ხელახლა
                                </button>
                                <button
                                    onClick={() =>
                                        setRetryOpen((o) => ({ ...o, [p.id]: !o[p.id] }))
                                    }
                                    disabled={regenerating[p.id]}
                                    className={`px-2.5 py-1.5 rounded-full shadow-md text-[11px] font-semibold inline-flex items-center gap-1 transition-all hover:scale-105 disabled:opacity-50 ${
                                        retryOpen[p.id]
                                            ? "bg-primary text-white"
                                            : "bg-white/95 hover:bg-white text-text-dark"
                                    }`}
                                    title="ხელახლა შენიშვნით"
                                >
                                    <MessageSquare size={12} /> შენიშვნა
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Retry-with-comment textarea */}
                    {retryOpen[p.id] && (
                        <div className="border-b border-rose-100 bg-rose-50/40 p-3 space-y-2">
                            <textarea
                                value={retryComment[p.id] || ""}
                                onChange={(e) =>
                                    setRetryComment((c) => ({ ...c, [p.id]: e.target.value }))
                                }
                                rows={2}
                                autoFocus
                                placeholder="რა გავასწოროთ? მაგ: გაასწორე ტიპო, შეცვალე გამოხედვა..."
                                className="w-full bg-white border border-rose-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary resize-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => regenerate(p.id, retryComment[p.id])}
                                    disabled={regenerating[p.id] || !(retryComment[p.id] || "").trim()}
                                    className="elegant-btn text-xs py-1.5 px-3 inline-flex items-center gap-1 disabled:opacity-40"
                                >
                                    <Send size={12} /> გადახატე
                                </button>
                                <button
                                    onClick={() =>
                                        setRetryOpen((o) => ({ ...o, [p.id]: false }))
                                    }
                                    className="text-xs text-text-mutted hover:text-text-dark"
                                >
                                    გაუქმება
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="p-4 flex-1 flex flex-col gap-2">
                        {/* Dialogue list */}
                        {Array.isArray(p.dialogue) && p.dialogue.length > 0 && (
                            <div className="space-y-1">
                                {p.dialogue.map((d, i) => (
                                    <p key={i} className="text-xs text-text-dark">
                                        <strong className="text-primary">{d.speaker}:</strong>{" "}
                                        <span className="italic">"{d.line}"</span>
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Caption + edit */}
                        <div className="flex items-start gap-2">
                            {editing === p.id ? (
                                <>
                                    <textarea
                                        value={editDraft}
                                        onChange={(e) => setEditDraft(e.target.value)}
                                        rows={2}
                                        autoFocus
                                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                                    />
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => saveCaption(p.id)}
                                            className="p-1.5 bg-primary text-white rounded-md hover:bg-primary-light"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onClick={() => setEditing(null)}
                                            className="p-1.5 bg-gray-100 text-text-dark rounded-md hover:bg-gray-200"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-text-dark font-serif italic flex-1 leading-snug">
                                        {p.caption || (
                                            <span className="text-text-mutted/50">წარწერა არ არის</span>
                                        )}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setEditing(p.id);
                                            setEditDraft(p.caption || "");
                                        }}
                                        className="text-text-mutted hover:text-primary p-1 transition-colors"
                                        title="ცვლილება"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Critic verdict — shows AI's review of this panel */}
                        {p.critique && <CritiqueBlock critique={p.critique} />}
                    </div>
                </div>
            ))}
        </div>
    );
}

function CritiqueBlock({ critique }) {
    const [open, setOpen] = useState(false);
    const score = critique.score || 6;
    const verdict = critique.overall || "acceptable";

    const tone =
        verdict === "good"
            ? { dot: "bg-green-500", text: "text-green-700", label: "კარგია" }
            : verdict === "needs_redo"
            ? { dot: "bg-red-500", text: "text-red-700", label: "გადახატე" }
            : { dot: "bg-amber-500", text: "text-amber-700", label: "ცოტა გასაუმჯობესებელია" };

    const textIssues = (critique.text_check?.bubbles || []).filter((b) => b?.ok === false);
    const captionIssue = critique.text_check?.caption && critique.text_check.caption.ok === false
        ? critique.text_check.caption
        : null;
    const visualIssues = critique.visual_issues || [];
    const suggestions = critique.suggestions || [];

    const hasDetails =
        textIssues.length > 0 ||
        captionIssue ||
        visualIssues.length > 0 ||
        suggestions.length > 0;

    return (
        <div className="mt-3 pt-3 border-t border-rose-100/60">
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 text-left group"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`relative flex h-2 w-2 shrink-0`}>
                        <span className={`absolute inset-0 rounded-full ${tone.dot} opacity-75 animate-pulse`} />
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${tone.dot}`} />
                    </span>
                    <span className={`text-[11px] uppercase tracking-[0.18em] font-semibold ${tone.text}`}>
                        AI: {tone.label}
                    </span>
                    <span className="text-[10px] font-mono text-text-mutted/60 tabular-nums">
                        {score}/10
                    </span>
                </div>
                {hasDetails && (
                    <span className="text-text-mutted/60 group-hover:text-primary transition-colors">
                        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                )}
            </button>

            {open && hasDetails && (
                <div className="mt-3 space-y-3 text-xs">
                    {textIssues.length > 0 && (
                        <div>
                            <p className="font-semibold text-text-dark mb-1.5 flex items-center gap-1.5">
                                <AlertTriangle size={11} className="text-amber-600" />
                                ტექსტი
                            </p>
                            <ul className="space-y-1.5 text-text-mutted leading-snug">
                                {textIssues.map((b, i) => (
                                    <li key={i}>
                                        <span className="text-red-600 font-mono">{b.rendered || "(ცარიელი)"}</span>
                                        {" → "}
                                        <span className="text-green-700 font-mono">{b.expected}</span>
                                        {b.note && <span className="block text-text-mutted/70 mt-0.5">{b.note}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {captionIssue && (
                        <div>
                            <p className="font-semibold text-text-dark mb-1.5">წარწერა</p>
                            <p className="text-text-mutted leading-snug">
                                <span className="text-red-600 font-mono">{captionIssue.rendered || "(ცარიელი)"}</span>
                                {" → "}
                                <span className="text-green-700 font-mono">{captionIssue.expected}</span>
                            </p>
                        </div>
                    )}

                    {visualIssues.length > 0 && (
                        <div>
                            <p className="font-semibold text-text-dark mb-1.5">ვიზუალური</p>
                            <ul className="space-y-1 text-text-mutted leading-snug list-disc list-inside">
                                {visualIssues.map((v, i) => (
                                    <li key={i}>{v}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {suggestions.length > 0 && (
                        <div>
                            <p className="font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                                <Sparkles size={11} /> რჩევები
                            </p>
                            <ul className="space-y-1 text-text-mutted leading-snug list-disc list-inside">
                                {suggestions.map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
