"use client";

import { useState, useEffect } from "react";

export function StickyTimer() {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Hydration fix for timer to start dynamically
        const hours = 2;
        const minutes = 14;
        const seconds = 59;
        setTimeLeft(hours * 3600 + minutes * 60 + seconds);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!isVisible || timeLeft === 0) return null;

    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="bg-primary text-white py-2 px-3 sm:px-4 w-full relative z-50 shadow-md flex justify-center items-center gap-1.5 sm:gap-3 text-xs sm:text-sm md:text-base font-medium flex-wrap text-center">
            <span className="animate-pulse">🔥</span>
            <span>-40% ფასდაკლება სრულდება:</span>
            <div className="flex gap-1 items-center font-mono font-bold bg-white/20 px-1.5 sm:px-2 py-0.5 rounded shadow-inner whitespace-nowrap">
                <span className="w-5 sm:w-6 text-center">{hours.toString().padStart(2, '0')}</span>:
                <span className="w-5 sm:w-6 text-center">{minutes.toString().padStart(2, '0')}</span>:
                <span className="w-5 sm:w-6 text-center">{seconds.toString().padStart(2, '0')}</span>
            </div>
            {/* Close button for the banner */}
            <button onClick={() => setIsVisible(false)} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 p-1">
                ✕
            </button>
        </div>
    );
}
