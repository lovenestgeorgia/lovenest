import { generateImage } from "@/lib/gemini";
import { generateImageOpenAI } from "@/lib/openai";

// Which model does PASS 1 (text-free panel art) and character sheets?
//   "openai" — gpt-image draws text-free art, Gemini adds the Georgian text on
//              top in PASS 2.
//   "gemini" — Nano Banana Pro does both passes.
// Edit the constant below to swap.
const ART_PROVIDER = "openai";

export function getArtProvider() {
    return ART_PROVIDER;
}

// Single entry point both routes call for PASS 1 / character sheets. Returns
// { base64, mimeType } regardless of which provider is active.
export async function generatePanelArt(opts) {
    if (getArtProvider() === "openai") {
        return generateImageOpenAI(opts);
    }
    return generateImage(opts);
}
