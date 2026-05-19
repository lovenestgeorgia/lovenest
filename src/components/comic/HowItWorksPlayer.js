"use client";

// Plays the pre-rendered Remotion explainer video (see /remotion-studio).
// Using a plain <video> instead of @remotion/player keeps the marketing
// bundle small and avoids React 19 hydration timing issues with the Player.
export function HowItWorksPlayer() {
    return (
        <div className="relative w-full max-w-5xl mx-auto rounded-[2rem] overflow-hidden border border-rose-100 shadow-[0_30px_70px_-30px_rgba(138,31,59,0.28)] bg-bg-light">
            <video
                src="/how-it-works.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label="როგორ მუშაობს კომიქსის გენერატორი"
                className="block w-full h-auto aspect-[16/9] bg-bg-light"
            />
        </div>
    );
}
