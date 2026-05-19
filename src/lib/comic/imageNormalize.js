import { loadImage, createCanvas } from "@napi-rs/canvas";

// OpenAI's images.edit endpoint is strict about file formats — claiming
// "image/png" while the buffer is actually JPEG/HEIC/WebP triggers a
// 400 "Invalid image file or mode for image N". We re-encode every
// reference photo to a known-good PNG before sending, also down-scaling
// anything bigger than MAX_DIM to keep payloads under their 4MB limit.

const MAX_DIM = 1536;

// Pass a buffer or a base64 string. Returns { base64, mimeType: "image/png" }.
// Falls back to the original bytes (still tagged image/png) on decode failure
// so an unfixable HEIC doesn't take the whole pipeline down.
export async function normalizeRefImage(input) {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "base64");
    try {
        const img = await loadImage(buf);
        let w = img.width;
        let h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
            const scale = MAX_DIM / Math.max(w, h);
            w = Math.max(1, Math.round(w * scale));
            h = Math.max(1, Math.round(h * scale));
        }
        const canvas = createCanvas(w, h);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const pngBuf = await canvas.encode("png");
        return { base64: pngBuf.toString("base64"), mimeType: "image/png" };
    } catch (e) {
        console.warn(
            `[normalizeRefImage] decode failed (${(e?.message || "").slice(0, 120)}), passing through as PNG-tagged.`
        );
        return { base64: buf.toString("base64"), mimeType: "image/png" };
    }
}

// Convenience: download a storage blob and return a normalized ref.
export async function downloadAndNormalize(admin, bucket, path) {
    try {
        const { data: blob } = await admin.storage.from(bucket).download(path);
        if (!blob) return null;
        const buf = Buffer.from(await blob.arrayBuffer());
        return await normalizeRefImage(buf);
    } catch (e) {
        console.warn(`[normalizeRefImage] storage fetch failed for ${path}: ${e.message}`);
        return null;
    }
}
