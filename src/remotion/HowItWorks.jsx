"use client";

import {
    AbsoluteFill,
    Sequence,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";

const FPS = 30;
const SCENE_FRAMES = 75; // 2.5 seconds per scene
const SCENES = 4;
export const HOW_IT_WORKS_DURATION = SCENE_FRAMES * SCENES;

const COLORS = {
    bg: "oklch(96% 0.018 55)",
    paper: "oklch(98% 0.014 60)",
    primary: "#8a1f3b",
    primarySoft: "oklch(70% 0.12 18)",
    primaryWash: "oklch(94% 0.04 25)",
    rose: "oklch(94% 0.05 25)",
    ink: "#2c2c2c",
    mute: "oklch(55% 0.01 30)",
    accent: "oklch(78% 0.10 50)",
};

const FONT_SERIF = "'Dachi The Lynx', 'Iowan Old Style', 'Cambria', serif";
const FONT_SANS =
    "'Inter', 'Helvetica Neue', system-ui, -apple-system, sans-serif";

// ── tiny easings ─────────────────────────────────────────────
const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
const easeInOutQuint = (t) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;

function sceneOpacity(local) {
    if (local < 6) return interpolate(local, [0, 6], [0, 1], { extrapolateRight: "clamp" });
    if (local > SCENE_FRAMES - 8)
        return interpolate(local, [SCENE_FRAMES - 8, SCENE_FRAMES], [1, 0], {
            extrapolateLeft: "clamp",
        });
    return 1;
}

// ── shared scene chrome ──────────────────────────────────────
function SceneFrame({ index, title, desc, children }) {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const localFrame = frame % SCENE_FRAMES;
    const opacity = sceneOpacity(localFrame);

    const numScale = spring({ frame: localFrame, fps, config: { damping: 14, mass: 0.6 } });
    const titleY = interpolate(localFrame, [10, 25], [12, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easeOutQuart,
    });
    const titleOpacity = interpolate(localFrame, [10, 25], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    const descOpacity = interpolate(localFrame, [18, 32], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill style={{ opacity }}>
            {/* Top-left ordinal badge */}
            <div
                style={{
                    position: "absolute",
                    top: 56,
                    left: 64,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 14,
                    fontFamily: FONT_SANS,
                    color: COLORS.mute,
                    fontSize: 12,
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                }}
            >
                <span style={{ width: 64, height: 1, background: "oklch(60% 0.01 30 / 0.35)" }} />
                ნაბიჯი {String(index + 1).padStart(2, "0")} / 04
            </div>

            {/* Big watermark numeral */}
            <div
                style={{
                    position: "absolute",
                    top: -10,
                    right: 44,
                    fontFamily: FONT_SERIF,
                    fontWeight: 700,
                    fontSize: 360,
                    lineHeight: 0.85,
                    color: COLORS.primary,
                    opacity: 0.07,
                    transform: `scale(${0.7 + numScale * 0.3})`,
                    transformOrigin: "right top",
                    fontVariantNumeric: "tabular-nums",
                    pointerEvents: "none",
                }}
            >
                {String(index + 1).padStart(2, "0")}
            </div>

            {/* Title + description, bottom-left */}
            <div
                style={{
                    position: "absolute",
                    left: 64,
                    bottom: 68,
                    maxWidth: 760,
                    color: COLORS.ink,
                }}
            >
                <div
                    style={{
                        fontFamily: FONT_SERIF,
                        fontSize: 84,
                        lineHeight: 0.95,
                        letterSpacing: "-0.015em",
                        fontWeight: 700,
                        transform: `translateY(${titleY}px)`,
                        opacity: titleOpacity,
                    }}
                >
                    {title}
                </div>
                <div
                    style={{
                        fontFamily: FONT_SANS,
                        fontSize: 24,
                        lineHeight: 1.45,
                        color: COLORS.mute,
                        fontWeight: 300,
                        marginTop: 16,
                        maxWidth: 580,
                        opacity: descOpacity,
                    }}
                >
                    {desc}
                </div>
            </div>

            {/* Per-scene visual */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                }}
            >
                {children}
            </div>
        </AbsoluteFill>
    );
}

// ── Scene 1: გვიამბე ისტორია (chat bubbles) ───────────────────
function ChatScene() {
    const frame = useCurrentFrame();
    const local = frame % SCENE_FRAMES;
    const { fps } = useVideoConfig();

    const bubbles = [
        { delay: 8, side: "left", top: 110, w: 320, h: 50, text: "მინდა ვუთხრა..." },
        { delay: 22, side: "right", top: 180, w: 260, h: 50, text: "მიამბე მეტი" },
        { delay: 36, side: "left", top: 250, w: 380, h: 70, text: "გავიცანი ერთ წვიმიან საღამოს" },
    ];

    return (
        <div style={{ position: "absolute", inset: 0 }}>
            {bubbles.map((b, i) => {
                const t = local - b.delay;
                if (t < 0) return null;
                const s = spring({ frame: t, fps, config: { damping: 14, mass: 0.5 } });
                const op = interpolate(t, [0, 8], [0, 1], { extrapolateRight: "clamp" });
                const isUser = b.side === "right";
                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            top: b.top,
                            [b.side]: 540,
                            width: b.w,
                            height: b.h,
                            borderRadius: 20,
                            borderBottomLeftRadius: isUser ? 20 : 6,
                            borderBottomRightRadius: isUser ? 6 : 20,
                            background: isUser ? COLORS.primary : COLORS.paper,
                            color: isUser ? COLORS.paper : COLORS.ink,
                            border: isUser ? "none" : "1px solid oklch(92% 0.025 25)",
                            boxShadow:
                                "0 14px 28px -16px rgba(138, 31, 59, 0.25)",
                            display: "flex",
                            alignItems: "center",
                            padding: "0 24px",
                            fontFamily: FONT_SANS,
                            fontSize: 18,
                            fontWeight: 500,
                            transform: `translateY(${(1 - s) * 18}px) scale(${0.92 + s * 0.08})`,
                            opacity: op,
                        }}
                    >
                        {b.text}
                    </div>
                );
            })}
        </div>
    );
}

// ── Scene 2: ატვირთე ფოტოები (photos fly in) ──────────────────
function PhotosScene() {
    const frame = useCurrentFrame();
    const local = frame % SCENE_FRAMES;
    const { fps } = useVideoConfig();

    const photos = [
        { delay: 6, x: 660, y: 130, rot: -7, tone: "oklch(70% 0.12 50)" },
        { delay: 14, x: 820, y: 200, rot: 4, tone: "oklch(65% 0.13 25)" },
        { delay: 22, x: 740, y: 290, rot: -2, tone: "oklch(72% 0.10 80)" },
    ];

    return (
        <div style={{ position: "absolute", inset: 0 }}>
            {photos.map((p, i) => {
                const t = local - p.delay;
                if (t < 0) return null;
                const s = spring({ frame: t, fps, config: { damping: 12, mass: 0.65 } });
                const op = interpolate(t, [0, 10], [0, 1], { extrapolateRight: "clamp" });
                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: p.x,
                            top: p.y,
                            width: 200,
                            height: 250,
                            background: COLORS.paper,
                            border: "1px solid oklch(92% 0.025 25)",
                            borderRadius: 14,
                            boxShadow: "0 20px 40px -16px rgba(40, 8, 15, 0.32)",
                            padding: 12,
                            transform: `rotate(${p.rot}deg) translateY(${(1 - s) * 30}px) scale(${0.9 + s * 0.1})`,
                            opacity: op,
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: 190,
                                borderRadius: 8,
                                background: `linear-gradient(${135 + i * 30}deg, ${p.tone}, oklch(50% 0.12 ${10 + i * 30}))`,
                            }}
                        />
                        <div
                            style={{
                                marginTop: 10,
                                height: 8,
                                width: "60%",
                                borderRadius: 4,
                                background: "oklch(90% 0.02 25)",
                            }}
                        />
                    </div>
                );
            })}

            {/* Upload arrow swoop */}
            <svg
                viewBox="0 0 1200 600"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                }}
            >
                <path
                    d="M 580 410 C 660 360, 700 280, 770 230"
                    stroke={COLORS.primary}
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                    fill="none"
                    strokeDashoffset={interpolate(local, [30, 60], [120, 0], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    })}
                    opacity={interpolate(local, [28, 38], [0, 0.7], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    })}
                />
            </svg>
        </div>
    );
}

// ── Scene 3: აირჩიე სტილი (palette of 6 swatches) ─────────────
function StylesScene() {
    const frame = useCurrentFrame();
    const local = frame % SCENE_FRAMES;
    const { fps } = useVideoConfig();

    const styles = [
        "oklch(78% 0.06 25)", // watercolor
        "oklch(68% 0.11 130)", // ghibli
        "oklch(45% 0.01 30)", // manga BW
        "oklch(60% 0.18 30)", // classic comic
        "oklch(82% 0.09 70)", // storybook
        "oklch(72% 0.13 250)", // minimal flat
    ];

    return (
        <div style={{ position: "absolute", inset: 0 }}>
            <div
                style={{
                    position: "absolute",
                    top: 130,
                    right: 100,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 16,
                    width: 440,
                }}
            >
                {styles.map((color, i) => {
                    const t = local - (8 + i * 5);
                    const s = spring({ frame: t < 0 ? 0 : t, fps, config: { damping: 12 } });
                    const op = interpolate(t, [0, 8], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    });
                    const selected = i === 1 && local > 50;
                    return (
                        <div
                            key={i}
                            style={{
                                aspectRatio: "3 / 4",
                                background: color,
                                borderRadius: 14,
                                boxShadow: selected
                                    ? `0 0 0 3px ${COLORS.primary}, 0 18px 36px -16px rgba(138, 31, 59, 0.45)`
                                    : "0 12px 26px -16px rgba(0,0,0,0.25)",
                                transform: `scale(${0.9 + s * 0.1}) ${selected ? "translateY(-6px)" : ""}`,
                                opacity: op,
                                transition: "box-shadow 200ms ease",
                            }}
                        />
                    );
                })}
            </div>

            {/* Check mark on the selected one */}
            <div
                style={{
                    position: "absolute",
                    top: 280,
                    right: 260,
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: COLORS.primary,
                    color: COLORS.paper,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                    opacity: interpolate(local, [54, 64], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    }),
                    transform: `scale(${spring({
                        frame: Math.max(0, local - 54),
                        fps,
                        config: { damping: 10 },
                    })})`,
                    boxShadow: "0 8px 24px -10px rgba(138, 31, 59, 0.65)",
                }}
            >
                ✓
            </div>
        </div>
    );
}

// ── Scene 4: AI ხატავს (ink strokes drawing themselves) ───────
function DrawingScene() {
    const frame = useCurrentFrame();
    const local = frame % SCENE_FRAMES;

    const strokes = [
        { d: "M 660 140 Q 800 90 950 150", delay: 6 },
        { d: "M 660 200 Q 800 240 950 200", delay: 14 },
        { d: "M 680 270 Q 820 230 950 280", delay: 22 },
        { d: "M 660 340 Q 800 380 940 340", delay: 30 },
    ];

    return (
        <div style={{ position: "absolute", inset: 0 }}>
            {/* Canvas frame */}
            <div
                style={{
                    position: "absolute",
                    top: 100,
                    right: 80,
                    width: 360,
                    height: 320,
                    background: COLORS.paper,
                    border: "1px solid oklch(92% 0.025 25)",
                    borderRadius: 18,
                    boxShadow: "0 22px 48px -20px rgba(40, 8, 15, 0.3)",
                    opacity: interpolate(local, [0, 10], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    }),
                }}
            />

            <svg
                viewBox="0 0 1200 600"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                }}
            >
                {strokes.map((s, i) => {
                    const t = local - s.delay;
                    if (t < 0) return null;
                    // Approximate path length so dashoffset travels cleanly.
                    const pathLen = 320;
                    const progress = interpolate(t, [0, 20], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: easeInOutQuint,
                    });
                    return (
                        <path
                            key={i}
                            d={s.d}
                            stroke={COLORS.primary}
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={pathLen}
                            strokeDashoffset={pathLen * (1 - progress)}
                            opacity={0.7}
                        />
                    );
                })}
            </svg>

            {/* Sparkles */}
            {[...Array(4)].map((_, i) => {
                const t = local - (24 + i * 6);
                if (t < 0) return null;
                const op = interpolate(t, [0, 8, 16], [0, 1, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                });
                const positions = [
                    { x: 680, y: 130 },
                    { x: 920, y: 260 },
                    { x: 780, y: 380 },
                    { x: 980, y: 180 },
                ];
                const p = positions[i];
                return (
                    <div
                        key={i}
                        style={{
                            position: "absolute",
                            left: p.x,
                            top: p.y,
                            fontSize: 28,
                            opacity: op,
                            color: COLORS.primary,
                            transform: `scale(${0.6 + (op || 0) * 0.4})`,
                            pointerEvents: "none",
                        }}
                    >
                        ✦
                    </div>
                );
            })}
        </div>
    );
}

// ── Background paper grain ───────────────────────────────────
function PaperBackground() {
    return (
        <AbsoluteFill style={{ background: COLORS.bg }}>
            <AbsoluteFill
                style={{
                    background:
                        "radial-gradient(120% 80% at 80% 20%, oklch(92% 0.045 30) 0%, transparent 60%)",
                    opacity: 0.55,
                }}
            />
            <AbsoluteFill
                style={{
                    background:
                        "radial-gradient(110% 80% at 10% 90%, oklch(95% 0.04 60) 0%, transparent 60%)",
                    opacity: 0.6,
                }}
            />
        </AbsoluteFill>
    );
}

// ── Composition ──────────────────────────────────────────────
export function HowItWorksComposition() {
    const STEPS = [
        {
            title: "გვიამბე ისტორია",
            desc: "AI გკითხავს და დაგეხმარება დეტალების ამოღებაში.",
            Scene: ChatScene,
        },
        {
            title: "ატვირთე ფოტოები",
            desc: "მონიშნე ვინ არის თითო ფოტოზე — ჩვენ დავიმახსოვრებთ.",
            Scene: PhotosScene,
        },
        {
            title: "აირჩიე სტილი",
            desc: "6 ვიზუალური სტილიდან აირჩიე ისეთი, რომელიც გრძნობას უხდება.",
            Scene: StylesScene,
        },
        {
            title: "AI ხატავს",
            desc: "თითო კადრი იხატება შენი პერსონაჟებითა და სცენებით.",
            Scene: DrawingScene,
        },
    ];

    return (
        <AbsoluteFill>
            <PaperBackground />
            {STEPS.map((s, i) => (
                <Sequence
                    key={i}
                    from={i * SCENE_FRAMES}
                    durationInFrames={SCENE_FRAMES}
                >
                    <SceneFrame index={i} title={s.title} desc={s.desc}>
                        <s.Scene />
                    </SceneFrame>
                </Sequence>
            ))}
        </AbsoluteFill>
    );
}

export const HOW_IT_WORKS_META = {
    fps: FPS,
    durationInFrames: HOW_IT_WORKS_DURATION,
    width: 1280,
    height: 720,
};
