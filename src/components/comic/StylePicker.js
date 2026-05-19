"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, ArrowLeft, Clock, Sparkles, BookOpen } from "lucide-react";

export function StylePicker({ projectId, styles, initialStyleId, initialPanelCount }) {
    const router = useRouter();
    const [selected, setSelected] = useState(initialStyleId);
    const [panelCount, setPanelCount] = useState(initialPanelCount || 10);
    const [advancing, setAdvancing] = useState(false);
    const [error, setError] = useState(null);

    const proceed = async () => {
        if (!selected) {
            setError("აირჩიე სტილი");
            return;
        }
        setAdvancing(true);
        setError(null);
        try {
            // Save style_id + panel_count, then verify the row actually
            // accepted our style_id. The PATCH allowlist can silently drop
            // fields it doesn't accept; reading the response back catches
            // any future regression.
            const res = await fetch(`/api/comic/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    style_id: selected,
                    panel_count: panelCount,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(json.error || "სტილის შენახვა ვერ მოხერხდა");
            }
            if (json.project && json.project.style_id !== selected) {
                throw new Error("სტილი ვერ შეინახა, განაახლე გვერდი და სცადე თავიდან");
            }
            router.push(`/comic/${projectId}/generate`);
        } catch (e) {
            setError(e.message);
            setAdvancing(false);
        }
    };

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {styles.map((s, idx) => {
                    const active = selected === s.id;
                    return (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelected(s.id)}
                            className="group text-left relative"
                            aria-pressed={active}
                        >
                            <div
                                className={`relative aspect-[3/4] rounded-2xl overflow-hidden bg-rose-50/40 transition-all duration-300 ${
                                    active
                                        ? "ring-2 ring-primary ring-offset-4 ring-offset-bg-light shadow-[0_20px_40px_-20px_rgba(138,31,59,0.4)]"
                                        : "ring-1 ring-rose-100/80 hover:ring-rose-300 shadow-[0_14px_30px_-18px_rgba(138,31,59,0.18)] group-hover:shadow-[0_18px_38px_-20px_rgba(138,31,59,0.28)]"
                                }`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={s.sample}
                                    alt={s.nameGe}
                                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
                                        active ? "scale-105" : "group-hover:scale-[1.03]"
                                    }`}
                                />

                                {/* Gentle dimming when not selected so the picked one pops */}
                                <div
                                    className={`absolute inset-0 transition-opacity duration-300 ${
                                        selected && !active
                                            ? "bg-bg-light/35 opacity-100"
                                            : "opacity-0"
                                    }`}
                                />

                                {active && (
                                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                                        <Check size={16} strokeWidth={2.5} />
                                    </div>
                                )}

                                {/* Ord watermark in the corner — typeset */}
                                <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/85 mix-blend-difference">
                                    {(idx + 1).toString().padStart(2, "0")}
                                </span>
                            </div>

                            <div className="mt-3 flex items-baseline justify-between gap-2 px-1">
                                <h3
                                    className={`font-serif text-base sm:text-lg leading-tight transition-colors ${
                                        active ? "text-primary" : "text-text-dark"
                                    }`}
                                >
                                    {s.nameGe}
                                </h3>
                            </div>
                            <p className="text-xs text-text-mutted mt-0.5 px-1 leading-snug">
                                {s.taglineGe}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Panel count slider */}
            <div className="border-y border-rose-100/60 py-6 max-w-md mx-auto">
                <div className="flex items-baseline justify-between mb-4">
                    <label
                        htmlFor="panel-count"
                        className="text-[11px] uppercase tracking-[0.22em] font-mono text-text-mutted"
                    >
                        რამდენი კადრი
                    </label>
                    <span className="font-serif text-3xl text-primary tabular-nums">
                        {panelCount}
                    </span>
                </div>
                <input
                    id="panel-count"
                    type="range"
                    min={6}
                    max={16}
                    value={panelCount}
                    onChange={(e) => setPanelCount(parseInt(e.target.value, 10))}
                    className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] uppercase tracking-[0.22em] font-mono text-text-mutted/70 mt-2">
                    <span>06 მოკლე</span>
                    <span>16 გრძელი</span>
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            {/* Pre-flight expectations — only shown when ready to launch */}
            {selected && (
                <div className="max-w-2xl mx-auto bg-gradient-to-br from-rose-50/60 to-amber-50/30 border border-rose-100 rounded-2xl p-5 sm:p-6">
                    <p className="text-[10px] uppercase tracking-[0.28em] font-mono text-primary/70 mb-3">
                        გენერაციის წინ
                    </p>
                    <h3 className="font-serif text-xl text-text-dark mb-4 leading-tight">
                        როცა დააწექი — ეს მოხდება
                    </h3>
                    <ul className="space-y-2.5 text-sm text-text-dark">
                        <li className="flex items-baseline gap-3">
                            <BookOpen size={14} className="text-primary translate-y-0.5 shrink-0" />
                            <span>
                                AI შენი ისტორიის გათვალისწინებით შეადგენს{" "}
                                <strong>{panelCount + 2}</strong> გვერდიან კომიქსს — ყდა, {panelCount}{" "}
                                კადრი და დასასრული
                            </span>
                        </li>
                        <li className="flex items-baseline gap-3">
                            <Sparkles size={14} className="text-primary translate-y-0.5 shrink-0" />
                            <span>თითო კადრი იხატება არჩეულ სტილში თქვენი პერსონაჟებით</span>
                        </li>
                        <li className="flex items-baseline gap-3">
                            <Clock size={14} className="text-primary translate-y-0.5 shrink-0" />
                            <span>
                                პროცესი დასჭირდება <strong>დაახლოებით 3-6 წუთს</strong>. ფანჯარა
                                შეგიძლია ღია დატოვო ან მოგვიანებით დაბრუნდე.
                            </span>
                        </li>
                    </ul>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => router.push(`/comic/${projectId}/characters`)}
                    disabled={advancing}
                    className="inline-flex items-center justify-center sm:justify-start gap-2 text-sm text-text-mutted hover:text-primary transition-colors py-2 disabled:opacity-40"
                >
                    <ArrowLeft size={16} /> პერსონაჟებზე დაბრუნება
                </button>
                <button
                    onClick={proceed}
                    disabled={advancing || !selected}
                    className="elegant-btn inline-flex items-center justify-center gap-2 disabled:opacity-40 py-3.5 sm:py-3"
                >
                    {advancing ? (
                        <span className="inline-flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            იწყება...
                        </span>
                    ) : (
                        <>
                            <Sparkles size={16} /> დაიწყე გენერაცია <ArrowRight size={16} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
