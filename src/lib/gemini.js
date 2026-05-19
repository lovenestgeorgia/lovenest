import { GoogleGenAI } from "@google/genai";

let _textClient;
let _imageClient;

export function getGemini() {
    if (_textClient) return _textClient;
    _textClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    return _textClient;
}

// Image generation can use a dedicated key (separate quota / billing project).
// Falls back to GEMINI_API_KEY if GEMINI_IMAGE_API_KEY is not set.
export function getGeminiImage() {
    if (_imageClient) return _imageClient;
    const apiKey = process.env.GEMINI_IMAGE_API_KEY || process.env.GEMINI_API_KEY;
    _imageClient = new GoogleGenAI({ apiKey });
    return _imageClient;
}

// Default primary models. Fallback IDs let the runtime degrade gracefully
// when the preferred model returns 503/UNAVAILABLE.
export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-pro";
export const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";

const TEXT_FALLBACKS = (process.env.GEMINI_TEXT_MODEL_FALLBACK || "gemini-2.5-flash")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// Pro-only by default. The product owner does not want Flash Image used —
// quality matters more than reliability. Set GEMINI_IMAGE_MODEL_FALLBACK
// explicitly if you want fallbacks; otherwise a 503 on Pro will fail the
// panel and the user can retry.
const IMAGE_FALLBACKS = (process.env.GEMINI_IMAGE_MODEL_FALLBACK || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// Image generation timeout. Pro can take 60-120s under load. With no Flash
// fallback configured, an aggressive timeout just makes runs flaky — give
// Pro 3 minutes before declaring it stuck.
const IMAGE_TIMEOUT_MS = 180_000;
const TEXT_TIMEOUT_MS = 60_000;

function withTimeout(promise, ms, label) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(
            () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
            ms
        );
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// True iff the error looks like a transient Gemini outage / rate limit /
// missing model — in those cases we should try the next fallback instead of
// bubbling the error up to the user. We treat 404 NOT_FOUND as transient too
// so a typo or deprecated model ID in the fallback list doesn't fail the run.
function isTransientGeminiError(err) {
    const msg = String(err?.message || err || "");
    return (
        /\b(404|429|500|502|503|504)\b/.test(msg) ||
        /NOT_FOUND|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|overloaded|deadline|timed out/i.test(msg)
    );
}

// Walk through [primary, ...fallbacks], retrying transient failures on the
// same model before falling forward. Re-throws the last error only if every
// model fails its retry budget. Catches Pro's intermittent timeouts so the
// user doesn't have to click retry every time the first attempt hangs.
const MAX_RETRIES_PER_MODEL = 2;

async function withModelFallback(models, attempt, kind = "request", summary = "") {
    let lastErr;
    for (let i = 0; i < models.length; i++) {
        const model = models[i];
        for (let r = 0; r < MAX_RETRIES_PER_MODEL; r++) {
            const start = Date.now();
            const tag = `${i + 1}/${models.length}${r > 0 ? ` retry=${r}` : ""}`;
            console.log(
                `[gemini:${kind}] → model="${model}" attempt=${tag} ${summary}`.trim()
            );
            try {
                const result = await attempt(model);
                console.log(
                    `[gemini:${kind}] ✓ model="${model}" ok in ${Date.now() - start}ms`
                );
                return result;
            } catch (e) {
                const ms = Date.now() - start;
                const transient = isTransientGeminiError(e);
                console.warn(
                    `[gemini:${kind}] ✗ model="${model}" ${transient ? "transient" : "fatal"} in ${ms}ms: ${String(e?.message || e).slice(0, 200)}`
                );
                lastErr = e;
                if (!transient) throw e;
                // Loop back for retry, or fall through to next model
            }
        }
    }
    throw lastErr;
}

function summarizeContentParts(contents) {
    const parts = contents?.[0]?.parts || [];
    const textChars = parts
        .filter((p) => p.text)
        .reduce((sum, p) => sum + (p.text?.length || 0), 0);
    const imgs = parts.filter((p) => p.inlineData).length;
    const bits = [];
    if (textChars) bits.push(`txt=${textChars}c`);
    if (imgs) bits.push(`imgs=${imgs}`);
    return bits.join(" ");
}

// Text generation with automatic model fallback. Use this anywhere we'd
// previously call `client.models.generateContent` directly for non-streaming
// text — e.g. JSON-structured script generation, persona extraction.
//
// `request` = same shape as the SDK's generateContent payload, EXCEPT `model`
// is set internally by the fallback loop.
export async function generateTextWithFallback(request) {
    const client = getGemini();
    const summary = summarizeContentParts(request?.contents);
    const jsonMode = request?.config?.responseMimeType === "application/json";
    return withModelFallback(
        [TEXT_MODEL, ...TEXT_FALLBACKS],
        (model) =>
            withTimeout(
                client.models.generateContent({ ...request, model }),
                TEXT_TIMEOUT_MS,
                `Gemini text (${model})`
            ),
        jsonMode ? "text-json" : "text",
        summary
    );
}

// Generate an image (optionally conditioned on reference images for character
// consistency). Returns { base64, mimeType }. Falls back through IMAGE_FALLBACKS
// if the primary model is overloaded.
export async function generateImage({ prompt, referenceImages = [], aspectRatio = "2:3" }) {
    const client = getGeminiImage();

    const parts = [{ text: prompt }];
    for (const ref of referenceImages) {
        parts.push({
            inlineData: {
                mimeType: ref.mimeType || "image/png",
                data: ref.base64,
            },
        });
    }

    const response = await withModelFallback(
        [IMAGE_MODEL, ...IMAGE_FALLBACKS],
        (model) =>
            withTimeout(
                client.models.generateContent({
                    model,
                    contents: [{ role: "user", parts }],
                    config: {
                        responseModalities: ["IMAGE"],
                        imageConfig: { aspectRatio },
                    },
                }),
                IMAGE_TIMEOUT_MS,
                `Gemini image generation (${model})`
            ),
        "image",
        `txt=${prompt?.length || 0}c refs=${referenceImages.length} ar=${aspectRatio}`
    );

    const candidate = response?.candidates?.[0];
    if (!candidate) throw new Error("Gemini returned no candidate");

    for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) {
            return {
                base64: part.inlineData.data,
                mimeType: part.inlineData.mimeType || "image/png",
            };
        }
    }
    throw new Error("Gemini response contained no image data");
}

// Convert OpenAI-style chat history to Gemini's `contents` format.
// - role "system" → handled separately as systemInstruction
// - role "assistant" → "model"
// - role "user" → "user"
export function toGeminiContents(messages) {
    return messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));
}

// Concatenate all system-role messages into a single instruction string.
export function extractSystemInstruction(messages) {
    return messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n\n");
}
