// Layout director — examines a freshly rendered comic panel that already
// contains EMPTY speech bubbles drawn by the image model, and returns the
// bounding rectangle of each bubble so the composer can stamp Georgian text
// inside. We don't draw the bubble shape ourselves; the image AI did.

import { generateTextWithFallback } from "@/lib/gemini";

const BUBBLE_DETECT_PROMPT = `You see a comic panel that contains EMPTY speech bubbles (and optionally one yellow caption box). Find each bubble and report its bounding rectangle. The bubbles will be filled with Georgian text afterwards by a separate process.

Output STRICT JSON, nothing else:

{
  "bubbles": [
    {
      "bbox": { "x": 0.0, "y": 0.0, "w": 0.0, "h": 0.0 }
    }
  ],
  "caption_bbox": { "x": 0.0, "y": 0.0, "w": 0.0, "h": 0.0 } | null
}

Coordinate space:
- All values normalized [0,1]: x = left edge, y = top edge, w = width, h = height.
- (0,0) is the TOP-LEFT corner of the panel, (1,1) is BOTTOM-RIGHT.

Rules:
- For each empty speech bubble, return the rectangle of its INTERIOR (the clean white space where text will go) — NOT the outer outline + tail.
- Order bubbles in NATURAL READING ORDER: top-first, then left-to-right when tied. This must match the order of dialogue lines provided by the caller.
- Be precise: the bbox should snugly fit just inside the bubble's border, with a small inner margin if the bubble is rounded.
- If you see fewer bubbles than expected, return what you actually see — do not invent.
- caption_bbox: only if there is a clearly visible yellow/cream caption box rectangle (typically at the top of the panel). Otherwise null.

Output JSON only.`;

export async function planPanelLayout({ imageBase64, mimeType = "image/png", dialogue, caption }) {
    const dialogueLines = (dialogue || [])
        .map((d, i) => `${i + 1}. ${d.speaker}: "${d.line}"`)
        .join("\n");

    const userText =
        `Dialogue lines, in order:\n${dialogueLines || "(none)"}\n` +
        (caption ? `Caption text: "${caption}"\n` : "Caption: (none)\n") +
        `\nFind the empty speech bubbles in the attached panel (and the caption box if present) and return their interior rectangles.`;

    let parsed;
    try {
        const result = await generateTextWithFallback({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: userText },
                        { inlineData: { mimeType, data: imageBase64 } },
                    ],
                },
            ],
            config: {
                systemInstruction: BUBBLE_DETECT_PROMPT,
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 512 },
            },
        });
        parsed = JSON.parse((result?.text || "{}").trim());
    } catch (e) {
        console.warn("[layout] director failed, using fallback:", e.message);
        parsed = {};
    }

    const dialogueCount = (dialogue || []).length;
    const detected = Array.isArray(parsed.bubbles) ? parsed.bubbles : [];
    const validDetected = detected.filter(
        (b) =>
            b?.bbox &&
            typeof b.bbox.x === "number" &&
            typeof b.bbox.y === "number" &&
            typeof b.bbox.w === "number" &&
            typeof b.bbox.h === "number" &&
            b.bbox.w > 0.05 &&
            b.bbox.h > 0.03
    );

    // Pad with fallback bubbles if vision found fewer than expected.
    while (validDetected.length < dialogueCount) {
        validDetected.push(fallbackBbox(validDetected.length, dialogueCount));
    }

    return {
        bubbles: validDetected.slice(0, dialogueCount).map((b) => ({
            bbox: clampBbox(b.bbox),
        })),
        caption_bbox: caption && parsed.caption_bbox ? clampBbox(parsed.caption_bbox) : null,
    };
}

function clampBbox(b) {
    const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number(v) || 0));
    return {
        x: clamp(b.x),
        y: clamp(b.y),
        w: clamp(b.w, 0.05, 1),
        h: clamp(b.h, 0.03, 1),
    };
}

function fallbackBbox(i, total) {
    // Fallback rectangles when vision misses bubbles — best-effort placement.
    const cols = Math.min(2, total);
    const col = i % cols;
    const row = Math.floor(i / cols);
    const w = 0.36;
    const h = 0.14;
    const x = col === 0 ? 0.05 : 1 - 0.05 - w;
    const y = 0.05 + row * (h + 0.04);
    return { bbox: { x, y, w, h } };
}
