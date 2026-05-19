import OpenAI, { toFile } from "openai";

let _client;

export function getOpenAI() {
    if (_client) return _client;
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return _client;
}

export const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY || "high"; // low | medium | high | auto

const IMAGE_TIMEOUT_MS = 180_000;
const MAX_RETRIES = 3; // attempts = MAX_RETRIES + 1
const RETRY_DELAYS_MS = [1500, 4000, 9000];

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

function sizeForAspect(aspectRatio) {
    if (aspectRatio === "1:1") return "1024x1024";
    if (aspectRatio === "3:2" || aspectRatio === "16:9") return "1536x1024";
    return "1024x1536"; // 2:3 default
}

// True for errors worth retrying — network blips, rate limits, OpenAI 5xx,
// internal timeouts. False for permanent problems (auth, bad request, content
// policy) so we fail fast instead of burning more quota.
function isTransientOpenAIError(e) {
    if (!e) return false;
    const status = e.status || e.statusCode || e.response?.status;
    if (status === 408 || status === 425 || status === 429) return true;
    if (status >= 500 && status < 600) return true;
    const msg = String(e.message || "").toLowerCase();
    if (
        msg.includes("timed out") ||
        msg.includes("timeout") ||
        msg.includes("network") ||
        msg.includes("fetch failed") ||
        msg.includes("socket") ||
        msg.includes("econnreset") ||
        msg.includes("econnrefused") ||
        msg.includes("etimedout") ||
        msg.includes("eai_again") ||
        msg.includes("apiconnection") ||
        msg.includes("aborted")
    ) {
        return true;
    }
    return false;
}

// Generate an image with OpenAI's image API. Supports reference images for
// character consistency via the images.edit endpoint when refs are provided.
// Automatically retries on transient errors. Returns { base64, mimeType }.
export async function generateImageOpenAI({ prompt, referenceImages = [], aspectRatio = "2:3" }) {
    const client = getOpenAI();
    const size = sizeForAspect(aspectRatio);
    const summary = `txt=${prompt?.length || 0}c refs=${referenceImages.length} ar=${aspectRatio}`;

    // Build the image files ONCE — re-encoding the same buffers on every
    // retry would be wasteful, and toFile is idempotent.
    const imageFiles = referenceImages.length
        ? await Promise.all(
              referenceImages.map(async (ref, i) =>
                  toFile(Buffer.from(ref.base64, "base64"), `ref-${i}.png`, {
                      type: ref.mimeType || "image/png",
                  })
              )
          )
        : null;

    let lastErr;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const start = Date.now();
        const attemptTag = attempt === 0 ? "" : ` (retry ${attempt}/${MAX_RETRIES})`;
        console.log(`[openai:image] → model="${IMAGE_MODEL}" ${summary}${attemptTag}`);

        try {
            const response = imageFiles
                ? await withTimeout(
                      client.images.edit({
                          model: IMAGE_MODEL,
                          image: imageFiles,
                          prompt,
                          size,
                          quality: IMAGE_QUALITY,
                          n: 1,
                      }),
                      IMAGE_TIMEOUT_MS,
                      `OpenAI image edit (${IMAGE_MODEL})`
                  )
                : await withTimeout(
                      client.images.generate({
                          model: IMAGE_MODEL,
                          prompt,
                          size,
                          quality: IMAGE_QUALITY,
                          n: 1,
                      }),
                      IMAGE_TIMEOUT_MS,
                      `OpenAI image generate (${IMAGE_MODEL})`
                  );

            const b64 = response?.data?.[0]?.b64_json;
            if (!b64) throw new Error("OpenAI returned no image data");

            console.log(
                `[openai:image] ✓ ${IMAGE_MODEL} ok in ${Date.now() - start}ms${attemptTag}`
            );
            return { base64: b64, mimeType: "image/png" };
        } catch (e) {
            lastErr = e;
            const transient = isTransientOpenAIError(e);
            console.warn(
                `[openai:image] ✗ ${IMAGE_MODEL} in ${Date.now() - start}ms${attemptTag}: ${(e?.message || "").slice(0, 200)} (transient=${transient})`
            );
            if (!transient || attempt === MAX_RETRIES) break;
            const wait = RETRY_DELAYS_MS[attempt] ?? 9000;
            await new Promise((r) => setTimeout(r, wait));
        }
    }
    throw lastErr;
}
