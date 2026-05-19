import { generateTextWithFallback } from "@/lib/gemini";

const CLASSIFY_SYSTEM = `You classify a user's correction comment about a single AI-generated comic panel.

The panel is produced in TWO passes:
1) ARTWORK pass (image model) — characters, faces, hair, hands, anatomy, poses, expressions, wardrobe, location/background, lighting, camera framing, composition.
2) TEXT pass (different model) — Georgian speech bubbles, captions, narration boxes, the cover title; the SHAPE, COLOR and PLACEMENT of bubbles; spelling/wording inside bubbles.

Read the user's correction and decide where the fix lives:
- "text"   — only the bubble / caption / title text needs to change (typo, wrong wording, wrong language, missing bubble, font/style of the lettering, bubble covering a face, wrong placement of a bubble).
- "visual" — the artwork itself needs to change (anatomy, missing limb, wrong face, wrong outfit, scene/background, pose, lighting, camera, expression).
- "both"   — both the artwork AND the text need fixing.

Be conservative — if you are unsure whether the user is complaining about the lettering vs. the drawing, choose "both".

Output STRICT JSON only, no prose, no markdown fences:
{ "kind": "text" | "visual" | "both", "reason": "one short sentence" }`;

export async function classifyRegenComment(comment) {
    const trimmed = (comment || "").trim();
    if (!trimmed) {
        return { kind: "both", reason: "no comment supplied, defaulting to full redo" };
    }
    try {
        const res = await generateTextWithFallback({
            contents: [
                {
                    role: "user",
                    parts: [{ text: `User correction comment:\n"""${trimmed}"""` }],
                },
            ],
            config: {
                systemInstruction: CLASSIFY_SYSTEM,
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 256 },
            },
        });
        const parsed = JSON.parse(res?.text || "{}");
        if (parsed.kind === "text" || parsed.kind === "visual" || parsed.kind === "both") {
            return { kind: parsed.kind, reason: parsed.reason || "" };
        }
    } catch (e) {
        console.warn("[classify] regen comment classifier failed:", e.message);
    }
    return { kind: "both", reason: "classifier unavailable, defaulting to full redo" };
}
