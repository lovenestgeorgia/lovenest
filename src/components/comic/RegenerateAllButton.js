"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

export function RegenerateAllButton({ projectId }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState(null);

    const doIt = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/comic/projects/${projectId}/panels`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error(j.error || "Failed");
            }
            router.push(`/comic/${projectId}/generate`);
        } catch (e) {
            setError(e.message);
            setLoading(false);
        }
    };

    if (confirming) {
        return (
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-text-mutted">
                    დარწმუნებული ხარ? ყველა კადრი წაიშლება.
                </span>
                <button
                    onClick={doIt}
                    disabled={loading}
                    className="elegant-btn text-sm py-2 px-4 disabled:opacity-40"
                >
                    {loading ? "მუშავდება..." : "კი, გაანახლე"}
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    disabled={loading}
                    className="elegant-btn-outline text-sm py-2 px-4"
                >
                    გაუქმება
                </button>
                {error && <span className="text-xs text-red-600">{error}</span>}
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="elegant-btn-outline inline-flex items-center gap-2 text-sm"
        >
            <RotateCcw size={16} /> ხელახლა გენერაცია
        </button>
    );
}
