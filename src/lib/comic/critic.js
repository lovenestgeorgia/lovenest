// Critic — second-pass model that reviews a freshly generated panel and
// returns structured feedback. Specifically checks whether the Georgian
// dialogue and caption text were rendered correctly (the most common
// failure mode of single-layer AI generation) plus any visual problems.

import { generateTextWithFallback } from "@/lib/gemini";

const CRITIC_SYSTEM_PROMPT = `You are a quality reviewer for AI-generated comic panels. You see a single rendered panel and the EXPECTED content (Georgian dialogue, optional caption, characters in scene, page type). Your job is to grade it and call out concrete problems the customer would notice.

Output STRICT JSON, nothing else:

{
  "overall": "good" | "acceptable" | "needs_redo",
  "score": 1,
  "text_check": {
    "bubbles": [
      { "expected": "...", "rendered": "...", "ok": true, "note": "" }
    ],
    "caption": { "expected": "...", "rendered": "...", "ok": true, "note": "" },
    "all_correct": true
  },
  "visual_issues": [],
  "suggestions": []
}

Scoring:
- score is an integer 1-10. 9-10 = ship as-is, 6-8 = acceptable with minor issues, 1-5 = needs regeneration.
- overall must agree with the score: "good" for 8+, "acceptable" for 6-7, "needs_redo" for ≤5.

text_check rules:
- For EACH expected speech bubble, look at the actual rendered Georgian text and compare CHARACTER BY CHARACTER. The "rendered" field is what you literally see in the image. "expected" is what the customer wrote. Set "ok": true only if they match exactly (allowing for minor decorative variations of letter shapes but not actual letter substitutions, missing letters, or extra letters). Put any discrepancy in "note" in Georgian, short.
- If a bubble is empty or missing, set rendered: "" and ok: false.
- caption: same logic. If no caption was expected, set the caption field to null.
- all_correct: true only if every bubble and the caption are ok.

visual_issues: short Georgian strings describing concrete problems — distorted face, wrong number of characters, character looks different from earlier panels, weird hand/finger anatomy, bubble covering a face, etc. Empty array if no issues.

suggestions: 1-3 short Georgian strings the customer could try if they regenerate — e.g. "სცადე უფრო ახლო კადრი", "გადახატე — სახე დამახინჯებულია".

Output JSON only. No markdown.`;

export async function critiquePanel({
    imageBase64,
    mimeType = "image/png",
    pageType,
    dialogue,
    caption,
    title,
    characters,
}) {
    const expectedLines = (dialogue || [])
        .map((d, i) => `${i + 1}. ${d.speaker}: "${d.line}"`)
        .join("\n");

    const cast = (characters || [])
        .map((c) => `- ${c.name}: ${c.persona || c.description || ""}`)
        .filter(Boolean)
        .join("\n");

    const userText = [
        `Page type: ${pageType}`,
        title ? `Expected title (cover only): "${title}"` : "",
        expectedLines ? `Expected speech bubbles:\n${expectedLines}` : "No dialogue expected.",
        caption ? `Expected caption: "${caption}"` : "No caption expected.",
        cast ? `Cast in this comic:\n${cast}` : "",
        "",
        "Review the attached panel. Compare every expected Georgian string against what is actually rendered in the image. List visual problems.",
    ]
        .filter(Boolean)
        .join("\n\n");

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
                systemInstruction: CRITIC_SYSTEM_PROMPT,
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 512 },
            },
        });
        const parsed = JSON.parse((result?.text || "{}").trim());
        return normalize(parsed);
    } catch (e) {
        console.warn("[critic] failed:", e.message);
        return null;
    }
}

function normalize(c) {
    return {
        overall: ["good", "acceptable", "needs_redo"].includes(c?.overall)
            ? c.overall
            : "acceptable",
        score: Math.max(1, Math.min(10, Math.round(Number(c?.score) || 6))),
        text_check: c?.text_check || null,
        visual_issues: Array.isArray(c?.visual_issues) ? c.visual_issues.slice(0, 6) : [],
        suggestions: Array.isArray(c?.suggestions) ? c.suggestions.slice(0, 4) : [],
    };
}
