"use client";

import { useState, useEffect } from "react";
import { Timer } from "lucide-react";

export function Countdown() {
    // Let's make it hit zero in 3 hours for urgency
    const [timeLeft, setTimeLeft] = useState(3 * 60 * 60 + 17 * 60 + 42); // 3h 17m 42s

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl inline-flex items-center gap-3 border border-red-100/50 shadow-sm">
            <Timer size={18} className="animate-pulse" />
            <span className="text-sm font-medium">აქცია მთავრდება:</span>
            <div className="flex gap-1 items-center font-mono font-bold text-base bg-white/60 px-2 py-0.5 rounded">
                <span className="w-6 text-center">{hours.toString().padStart(2, '0')}</span>:
                <span className="w-6 text-center">{minutes.toString().padStart(2, '0')}</span>:
                <span className="w-6 text-center">{seconds.toString().padStart(2, '0')}</span>
            </div>
        </div>
    );
}
