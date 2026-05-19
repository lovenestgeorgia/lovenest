"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ServerCrash, X, RotateCcw } from "lucide-react";

// Generic modal for AI/generation failures, used on both the character upload
// step and the generation page. Accepts an error object so we can vary the
// copy by failure mode.
//
// error: {
//   code?: "ai_unavailable" | "ai_failed" | "generation_failed" | string,
//   detail?: string,
//   primaryLabel?: string,
//   onPrimary?: () => void,
//   secondaryLabel?: string,
//   onSecondary?: () => void,
// }
export function AiErrorModal({ error, onClose }) {
    if (!error) {
        return <AnimatePresence />;
    }

    const isTransient = error.code === "ai_unavailable";
    const isGeneration = error.code === "generation_failed";

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-[100] bg-text-dark/40 backdrop-blur-sm flex items-center justify-center p-6"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.96, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.96, opacity: 0, y: 8 }}
                    transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-100 p-8"
                >
                    <button
                        onClick={onClose}
                        aria-label="დახურვა"
                        className="absolute top-4 right-4 text-text-mutted hover:text-text-dark p-1 rounded-full"
                    >
                        <X size={18} />
                    </button>

                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-primary flex items-center justify-center mb-5">
                        <ServerCrash size={26} />
                    </div>

                    <h2 className="font-serif text-2xl text-text-dark mb-3 leading-tight">
                        {isTransient ? (
                            <>
                                AI <span className="italic text-primary">დროებით</span>{" "}
                                გადატვირთულია
                            </>
                        ) : isGeneration ? (
                            <>
                                გენერაცია <span className="italic text-primary">გაჩერდა</span>
                            </>
                        ) : (
                            <>
                                რაღაც <span className="italic text-primary">არასწორად</span>{" "}
                                წავიდა
                            </>
                        )}
                    </h2>

                    <div className="space-y-3 text-sm text-text-mutted leading-relaxed">
                        {isTransient ? (
                            <>
                                <p>
                                    Google-ის AI სერვისი ამჟამად გაზრდილი დატვირთვის ქვეშ მუშაობს.
                                    ეს ხშირად 1-2 წუთში გადის.
                                </p>
                                <p>
                                    გთხოვ, ცოტა ხანში სცადე ხელახლა. შენი მონაცემები არსად არ
                                    წაშლილა.
                                </p>
                            </>
                        ) : isGeneration ? (
                            <p>
                                კომიქსის შექმნა შეფერხდა. ეს ხშირად AI სერვისის დროებითი პრობლემაა.
                                შენი ისტორია და პერსონაჟები შენახულია — ცადე ხელახლა, ან აირჩიე
                                სხვა სტილი.
                            </p>
                        ) : (
                            <>
                                <p>
                                    AI-სთან კავშირისას მოულოდნელი შეცდომა მოხდა. შენი მონაცემები
                                    არსად არ წაშლილა.
                                </p>
                                <p>გთხოვ, ცადე ხელახლა. თუ პრობლემა გრძელდება, დაგვიკავშირდი.</p>
                            </>
                        )}
                        <p className="text-primary font-medium">ვწუხვართ შეფერხებისთვის.</p>
                    </div>

                    {error.detail && (
                        <details className="mt-5 group">
                            <summary className="text-[10px] uppercase tracking-[0.18em] text-text-mutted/60 cursor-pointer hover:text-text-dark transition-colors">
                                ტექნიკური დეტალები
                            </summary>
                            <pre className="mt-2 text-[10px] font-mono text-text-mutted bg-rose-50/40 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
                                {error.detail}
                            </pre>
                        </details>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 mt-6">
                        {error.onPrimary ? (
                            <button
                                onClick={error.onPrimary}
                                className="elegant-btn flex-1 inline-flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={14} /> {error.primaryLabel || "სცადე თავიდან"}
                            </button>
                        ) : (
                            <button onClick={onClose} className="elegant-btn flex-1">
                                გავიგე
                            </button>
                        )}
                        {error.onSecondary && (
                            <button
                                onClick={error.onSecondary}
                                className="elegant-btn-outline flex-1"
                            >
                                {error.secondaryLabel || "გაუქმება"}
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
