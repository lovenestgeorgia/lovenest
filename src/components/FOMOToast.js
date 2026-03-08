"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Image from "next/image";

const buyers = [
    "მარიამ ც. (თბილისი)", "ანა მ. (ბათუმი)", "გიორგი კ. (ქუთაისი)",
    "ნინო ჟ. (რუსთავი)", "სალომე ე. (გორი)", "ლევან დ. (თბილისი)",
    "თიკა წ. (თბილისი)", "ელენე ბ. (ქუთაისი)"
];

const times = ["2 წუთის წინ", "5 წუთის წინ", "10 წუთის წინ", "ახლახანს", "1 წუთის წინ", "15 წუთის წინ"];

export function FOMOToast() {
    const [mounted, setMounted] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        setMounted(true);

        const triggerToast = () => {
            const randomBuyer = buyers[Math.floor(Math.random() * buyers.length)];
            const randomTime = times[Math.floor(Math.random() * times.length)];
            setToast({ buyer: randomBuyer, time: randomTime });

            // Hide after 6 seconds
            setTimeout(() => {
                setToast(null);
            }, 6000);
        };

        // First toast shortly after load
        const firstTimeout = setTimeout(triggerToast, 3500);

        // Then random intervals
        const interval = setInterval(() => {
            triggerToast();
        }, 25000);

        return () => {
            clearTimeout(firstTimeout);
            clearInterval(interval);
        };
    }, []);

    if (!mounted) return null;

    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="fixed bottom-28 md:bottom-6 left-4 md:left-6 z-50 bg-white/95 backdrop-blur-sm shadow-2xl border border-rose-100 rounded-xl p-3 flex items-center gap-3 sm:gap-4 max-w-[320px] pointer-events-none"
                >
                    <div className="w-12 h-14 relative rounded-md overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                        {/* Fallback pattern if no image */}
                        <div className="absolute inset-0 bg-rose-50 flex items-center justify-center text-primary font-serif font-bold text-lg">L</div>
                        <Image src="/hero.png" alt="Product" fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-dark leading-tight flex items-center gap-1.5 truncate">
                            <span className="truncate">{toast.buyer}</span>
                            <CheckCircle size={14} className="text-green-500 shrink-0" />
                        </p>
                        <p className="text-xs text-text-mutted mt-0.5 truncate">შეიძინა "წამიკითხე.."</p>
                        <p className="text-[10px] text-primary font-medium mt-1">{toast.time}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
