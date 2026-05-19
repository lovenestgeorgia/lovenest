// Composer — given a comic panel image that ALREADY contains empty speech
// bubbles drawn by the image model, plus the dialogue and the layout director's
// detected bubble rectangles, stamps Georgian text inside each bubble.
//
// We don't draw the bubble shape — the AI did. We only fit the text into the
// bubble's interior with a real Georgian font for perfect spelling.

import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import path from "node:path";

const FONT_FAMILY = "Noto Sans Georgian";
let _fontReady = false;
function ensureFont() {
    if (_fontReady) return;
    const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansGeorgian-Bold.ttf");
    try {
        GlobalFonts.registerFromPath(fontPath, FONT_FAMILY);
        _fontReady = true;
    } catch (e) {
        console.warn("[compose] font register failed:", e.message);
    }
}

export async function composePanel({ imageBuffer, dialogue, caption, layout, pageType }) {
    ensureFont();
    const img = await loadImage(imageBuffer);
    const W = img.width;
    const H = img.height;

    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    if (pageType !== "cover") {
        // Speech bubble text
        if (Array.isArray(dialogue) && dialogue.length > 0) {
            const bubbles = layout?.bubbles || [];
            for (let i = 0; i < dialogue.length; i++) {
                const line = dialogue[i];
                const bbox = bubbles[i]?.bbox;
                if (!bbox) continue;
                fillTextIntoBox(ctx, W, H, line.line, bbox, { color: "#0a0a0a", weight: 600 });
            }
        }

        // Caption text
        if (caption && layout?.caption_bbox) {
            fillTextIntoBox(ctx, W, H, caption, layout.caption_bbox, {
                color: "#0a0a0a",
                weight: 600,
            });
        }
    }

    return canvas.toBuffer("image/png");
}

export async function composeCover({ imageBuffer, title, subtitle }) {
    ensureFont();
    const img = await loadImage(imageBuffer);
    const W = img.width;
    const H = img.height;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    if (title) drawCoverTitle(ctx, W, H, title, subtitle);
    return canvas.toBuffer("image/png");
}

/* ─────────────────────── text fitting ─────────────────────── */

// Auto-fit Georgian text into a bbox. The bubble shape was drawn by the AI;
// we just need the text to look comfortable inside the interior rectangle.
function fillTextIntoBox(ctx, W, H, text, bbox, opts = {}) {
    const value = (text || "").toString().trim();
    if (!value) return;

    const innerMargin = 0.06; // 6% padding inside the bbox
    const boxX = bbox.x * W;
    const boxY = bbox.y * H;
    const boxW = bbox.w * W;
    const boxH = bbox.h * H;
    const padX = boxW * innerMargin;
    const padY = boxH * innerMargin;
    const usableW = boxW - padX * 2;
    const usableH = boxH - padY * 2;
    const color = opts.color || "#0a0a0a";
    const weight = opts.weight || 600;

    // Binary-search-ish for the largest font size that fits.
    // Start at a generous size proportional to bubble height.
    let fontSize = Math.min(boxH * 0.36, boxW * 0.14);
    fontSize = Math.max(14, Math.floor(fontSize));

    let lines;
    let lineHeight;
    let safety = 0;
    while (safety++ < 20) {
        ctx.font = `${weight} ${fontSize}px "${FONT_FAMILY}"`;
        lines = wrapText(ctx, value, usableW);
        lineHeight = fontSize * 1.22;
        const blockH = lines.length * lineHeight;
        if (blockH <= usableH && lines.every((l) => ctx.measureText(l).width <= usableW)) {
            break;
        }
        fontSize -= Math.max(1, Math.floor(fontSize * 0.07));
        if (fontSize < 10) break;
    }

    if (!lines || !lines.length) return;

    // Vertically center the text block
    const totalH = lines.length * lineHeight;
    let ty = boxY + padY + (usableH - totalH) / 2;

    ctx.fillStyle = color;
    ctx.textBaseline = "top";
    for (const ln of lines) {
        const tw = ctx.measureText(ln).width;
        const tx = boxX + padX + (usableW - tw) / 2;
        ctx.fillText(ln, tx, ty);
        ty += lineHeight;
    }
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(/\s+/);
    const lines = [];
    let current = "";
    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (ctx.measureText(candidate).width <= maxWidth || !current) {
            current = candidate;
        } else {
            lines.push(current);
            current = word;
        }
    }
    if (current) lines.push(current);
    return lines;
}

/* ─────────────────────── cover (title overlay) ─────────────────────── */

function drawCoverTitle(ctx, W, H, title, subtitle) {
    const titleSize = Math.round(W * 0.085);
    const subSize = Math.round(W * 0.034);
    const padding = W * 0.06;

    ctx.font = `800 ${titleSize}px "${FONT_FAMILY}"`;
    const titleLines = wrapText(ctx, title, W - padding * 2);
    const titleLineH = titleSize * 1.05;
    let subLines = [];
    if (subtitle) {
        ctx.font = `500 italic ${subSize}px "${FONT_FAMILY}"`;
        subLines = wrapText(ctx, subtitle, W - padding * 2);
    }
    const subLineH = subSize * 1.2;
    const totalH =
        titleLines.length * titleLineH +
        (subLines.length ? subLineH * subLines.length + W * 0.02 : 0);
    let y = H * 0.1;

    const scrim = ctx.createLinearGradient(0, 0, 0, y + totalH + W * 0.04);
    scrim.addColorStop(0, "rgba(0,0,0,0.55)");
    scrim.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, W, y + totalH + W * 0.04);

    ctx.font = `800 ${titleSize}px "${FONT_FAMILY}"`;
    ctx.fillStyle = "#fff8e7";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;
    ctx.textBaseline = "top";
    for (const ln of titleLines) {
        const tw = ctx.measureText(ln).width;
        ctx.fillText(ln, (W - tw) / 2, y);
        y += titleLineH;
    }
    ctx.shadowColor = "transparent";

    if (subLines.length) {
        y += W * 0.012;
        ctx.font = `500 italic ${subSize}px "${FONT_FAMILY}"`;
        ctx.fillStyle = "#ffd6c2";
        for (const ln of subLines) {
            const tw = ctx.measureText(ln).width;
            ctx.fillText(ln, (W - tw) / 2, y);
            y += subLineH;
        }
    }
}
