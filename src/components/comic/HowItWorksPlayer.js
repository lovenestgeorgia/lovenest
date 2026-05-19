"use client";

import { Player } from "@remotion/player";
import {
    HowItWorksComposition,
    HOW_IT_WORKS_META,
} from "@/remotion/HowItWorks";

// Wraps the Remotion composition in a Player so it autoplays inline on the
// marketing page. The aspect ratio is locked to 16:9 to match the composition
// dimensions; CSS scales it down responsively.
export function HowItWorksPlayer() {
    return (
        <div className="relative w-full max-w-5xl mx-auto rounded-[2rem] overflow-hidden border border-rose-100 shadow-[0_30px_70px_-30px_rgba(138,31,59,0.28)] bg-bg-light">
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
        </div>
    );
}
