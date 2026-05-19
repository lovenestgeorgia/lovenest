"use client";

import { useEffect, useRef } from "react";
import { Player } from "@remotion/player";
import {
    HowItWorksComposition,
    HOW_IT_WORKS_META,
} from "@/remotion/HowItWorks";

// Pure client component — only imported via next/dynamic({ ssr: false }) by
// HowItWorksPlayer so Next never tries to render @remotion/player on the
// server. We additionally call .play() via ref after mount because the
// autoPlay prop alone isn't always honored (browser autoplay heuristics +
// React 19 hydration timing).
export function HowItWorksPlayerInner() {
    const ref = useRef(null);

    useEffect(() => {
        const start = () => {
            try {
                ref.current?.seekTo(0);
                ref.current?.play();
            } catch {
                // play() can throw if the user hasn't interacted yet — the
                // clickToPlay handler below recovers.
            }
        };
        // Defer to next tick so the player has wired up its internals.
        const t = setTimeout(start, 80);
        return () => clearTimeout(t);
    }, []);

    return (
        <Player
            ref={ref}
            component={HowItWorksComposition}
            durationInFrames={HOW_IT_WORKS_META.durationInFrames}
            compositionWidth={HOW_IT_WORKS_META.width}
            compositionHeight={HOW_IT_WORKS_META.height}
            fps={HOW_IT_WORKS_META.fps}
            initialFrame={0}
            autoPlay
            loop
            clickToPlay
            showVolumeControls={false}
            controls
            style={{ width: "100%", height: "auto", display: "block" }}
        />
    );
}
