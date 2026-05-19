import { generateImage } from "@/lib/gemini";
import { generateImageOpenAI } from "@/lib/openai";

// Which model does PASS 1 (text-free panel art) and character sheets?
// - "gemini" (default): Nano Banana Pro for everything. Text overlay (PASS 2)
//   is always Gemini regardless.
// - "openai": OpenAI gpt-image for art only; Gemini still does text overlay.
//
// Flip this with IMAGE_PROVIDER=openai in .env.local to re-enable the gpt-image
// pipeline without touching code.
export function getArtProvider() {
    return (process.env.IMAGE_PROVIDER || "gemini").toLowerCase();
}

// Single entry point both routes call for PASS 1 / character sheets. Returns
// { base64, mimeType } regardless of which provider is active.
export async function generatePanelArt(opts) {
    if (getArtProvider() === "openai") {
        return generateImageOpenAI(opts);
    }
    return generateImage(opts);
}
