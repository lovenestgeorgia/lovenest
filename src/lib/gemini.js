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

export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-pro";
// "Nano Banana Pro" — Gemini's high-quality image generation model.
// If the API rejects this ID, override via env (try gemini-3-pro-image,
// gemini-2.5-flash-image, etc.).
export const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";

// Generate an image (optionally conditioned on reference images for
// character consistency). Returns { base64, mimeType }.
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

    const response = await client.models.generateContent({
        model: IMAGE_MODEL,
        contents: [{ role: "user", parts }],
        config: {
            responseModalities: ["IMAGE"],
            imageConfig: { aspectRatio },
        },
    });

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
