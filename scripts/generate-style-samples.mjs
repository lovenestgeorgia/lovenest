// One-shot script: produces one showcase comic panel per style preset
// and writes it to public/comic-styles/<style-id>.png so the marketing
// landing page has real samples instead of gradient placeholders.
//
// Usage:
//   node --env-file=.env.local scripts/generate-style-samples.mjs
//
// Re-run after editing styles.js promptPrefix values.

import { GoogleGenAI } from "@google/genai";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const STYLES = [
    {
        id: "romantic-watercolor",
        prefix:
            "Romantic watercolor illustration, soft pastel palette of blush pink, peach and cream, " +
            "delicate wet-on-wet washes, gentle linework, dreamy atmosphere, warm natural light, " +
            "painterly brushstrokes, in the style of a high-end greeting card illustration.",
    },
    {
        id: "ghibli-esque",
        prefix:
            "Painterly anime illustration in the style of a Studio Ghibli film, lush hand-painted backgrounds, " +
            "warm golden-hour lighting, gentle expressive faces, soft cel-shading, cinematic composition, " +
            "rich atmospheric color, whimsical and emotional.",
    },
    {
        id: "manga-bw",
        prefix:
            "Black and white manga illustration, clean confident line art, expressive faces, " +
            "screentone shading, dramatic angles, dynamic paneling sensibility, high contrast ink, " +
            "no color, professional manga studio quality.",
    },
    {
        id: "classic-comic",
        prefix:
            "Classic American comic book illustration, bold black ink outlines, flat saturated colors, " +
            "Ben-Day halftone dot shading, dynamic poses, expressive faces, vivid color palette, " +
            "in the style of a 1990s comic book panel.",
    },
    {
        id: "storybook",
        prefix:
            "Children's storybook illustration, gouache and pencil texture, warm cozy palette, " +
            "rounded charming character design, soft natural lighting, gentle composition, " +
            "in the style of a modern award-winning picture book.",
    },
    {
        id: "minimalist-flat",
        prefix:
            "Modern minimalist flat illustration, simple geometric shapes, limited muted color palette, " +
            "no outlines, clean negative space, expressive but stylized characters, " +
            "in the style of contemporary editorial illustration.",
    },
];

const SCENE =
    "A single comic panel: two romantic partners sitting close together on a window seat in a warm-lit room, " +
    "looking at each other softly. Afternoon light pours through a tall window behind them. " +
    "One small white speech bubble in the upper right with the Georgian text rendered legibly: \"მენატრებოდი\" (Georgian for \"I missed you\"). " +
    "Their faces are tender, the moment is intimate but not sentimental. Portrait 3:4 framing. " +
    "No watermark, no signature, no comic panel border.";

const apiKey = process.env.GEMINI_IMAGE_API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Missing GEMINI_API_KEY (or GEMINI_IMAGE_API_KEY) in env.");
    process.exit(1);
}

const client = new GoogleGenAI({ apiKey });
const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";

const outDir = resolve("public", "comic-styles");
await mkdir(outDir, { recursive: true });

console.log(`Model: ${model}`);
console.log(`Output: ${outDir}\n`);

for (const style of STYLES) {
    process.stdout.write(`→ ${style.id.padEnd(22)} `);
    try {
        const prompt = `${style.prefix}\n\nSINGLE COMIC PANEL.\n${SCENE}`;
        const response = await client.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseModalities: ["IMAGE"],
                imageConfig: { aspectRatio: "3:4" },
            },
        });
        const part = response?.candidates?.[0]?.content?.parts?.find(
            (p) => p.inlineData?.data
        );
        if (!part) throw new Error("no image data in response");
        const buf = Buffer.from(part.inlineData.data, "base64");
        const file = resolve(outDir, `${style.id}.png`);
        await writeFile(file, buf);
        console.log(`✓ (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
        console.log(`✗ ${e.message}`);
    }
}

console.log("\nDone. Restart the dev server if you don't see the new images.");
