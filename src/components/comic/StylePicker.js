"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";

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
            await fetch(`/api/comic/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    style_id: selected,
                    panel_count: panelCount,
                    status: "generating",
                }),
            });
            router.push(`/comic/${projectId}/generate`);
        } catch (e) {
            setError(e.message);
            setAdvancing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {styles.map((s) => {
                    const active = selected === s.id;
                    return (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelected(s.id)}
                            className={`text-left bg-white rounded-2xl border-2 p-4 transition-all relative ${
                                active
                                    ? "border-primary shadow-lg ring-4 ring-primary/10"
                                    : "border-rose-100 hover:border-rose-300"
                            }`}
                        >
                            {active && (
                                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                                    <Check size={16} />
                                </div>
                            )}
                            <div className="aspect-[3/4] rounded-xl bg-gradient-to-br from-rose-50 to-amber-50 mb-3 flex items-center justify-center text-primary/40 text-sm font-medium overflow-hidden">
                                {s.name}
                            </div>
                            <h3 className="font-serif font-bold text-text-dark">{s.nameGe}</h3>
                            <p className="text-xs text-text-mutted mt-1">{s.taglineGe}</p>
                        </button>
                    );
                })}
            </div>

            <div className="bg-rose-50/20 border border-rose-100 rounded-2xl p-5">
                <label className="block text-sm font-medium text-text-dark mb-3">
                    რამდენი კადრი? <span className="text-primary font-bold">{panelCount}</span>
                </label>
                <input
                    type="range"
                    min={6}
                    max={16}
                    value={panelCount}
                    onChange={(e) => setPanelCount(parseInt(e.target.value, 10))}
                    className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-text-mutted mt-2">
                    <span>6 (მოკლე)</span>
                    <span>16 (გრძელი)</span>
                </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end pt-4 border-t border-rose-50">
                <button
                    onClick={proceed}
                    disabled={advancing || !selected}
                    className="elegant-btn inline-flex items-center gap-2 disabled:opacity-40"
                >
                    {advancing ? "მუშავდება..." : <>გენერაცია <ArrowRight size={16} /></>}
                </button>
            </div>
        </div>
    );
}
