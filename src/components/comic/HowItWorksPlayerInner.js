"use client";

import { Player } from "@remotion/player";
import {
    HowItWorksComposition,
    HOW_IT_WORKS_META,
} from "@/remotion/HowItWorks";

// Pure client component — only imported via next/dynamic({ ssr: false }) by
// HowItWorksPlayer so Next never tries to render @remotion/player on the
// server. Keeps autoplay+loop, hides the native controls.
export function HowItWorksPlayerInner() {
    return (
        <Player
            component={HowItWorksComposition}
            durationInFrames={HOW_IT_WORKS_META.durationInFrames}
            compositionWidth={HOW_IT_WORKS_META.width}
            compositionHeight={HOW_IT_WORKS_META.height}
            fps={HOW_IT_WORKS_META.fps}
            autoPlay
            loop
            style={{ width: "100%", height: "auto", display: "block" }}
            controls={false}
        />
    );
}
