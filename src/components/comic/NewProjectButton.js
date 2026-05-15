"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProjectButton({ children, className }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onClick = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/comic/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "უსათაურო ისტორია" }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed");
            router.push(`/comic/${json.id}/unlock`);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button onClick={onClick} disabled={loading} className={className}>
                {loading ? "იქმნება..." : children}
            </button>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </>
    );
}
