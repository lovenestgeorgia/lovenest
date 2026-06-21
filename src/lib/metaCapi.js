import crypto from "crypto";

// SHA-256 hash (lowercased + trimmed) as required by Meta for user_data fields.
const sha256 = (v) =>
    v ? crypto.createHash("sha256").update(String(v).trim().toLowerCase()).digest("hex") : undefined;

// Normalize a Georgian phone number to digits with country code (e.g. 995XXXXXXXXX).
function normalizePhone(p) {
    if (!p) return undefined;
    let d = String(p).replace(/[^0-9]/g, "");
    if (d.length === 9 && d.startsWith("5")) d = "995" + d; // local GE mobile -> add country code
    return d || undefined;
}

/**
 * Send a server-side "Purchase" event to the Meta Conversions API.
 * Reliable & redirect/adblock-proof — fired from the UniPay webhook when a
 * payment is confirmed. Deduplicates with the browser pixel via a shared
 * event_id (the order id), so a sale is counted once even if both fire.
 *
 * Requires env var META_CAPI_ACCESS_TOKEN (a system-user / page token with
 * access to the pixel). If missing, it logs and no-ops (never breaks checkout).
 */
export async function sendPurchaseCapi({
    value,
    currency = "GEL",
    eventId,
    email,
    phone,
    clientIp,
    userAgent,
    eventSourceUrl = "https://lovenest.ge/success",
} = {}) {
    const PIXEL_ID = process.env.FB_PIXEL_ID || "481894767979502";
    const TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
    if (!TOKEN) {
        console.warn("[CAPI] META_CAPI_ACCESS_TOKEN not set — skipping server-side Purchase event");
        return { skipped: true };
    }

    const user_data = {};
    const em = sha256(email);
    const ph = sha256(normalizePhone(phone));
    if (em) user_data.em = [em];
    if (ph) user_data.ph = [ph];
    if (clientIp) user_data.client_ip_address = clientIp;
    if (userAgent) user_data.client_user_agent = userAgent;

    const payload = {
        data: [
            {
                event_name: "Purchase",
                event_time: Math.floor(Date.now() / 1000),
                action_source: "website",
                ...(eventId ? { event_id: String(eventId) } : {}),
                event_source_url: eventSourceUrl,
                user_data,
                custom_data: {
                    currency,
                    value: typeof value === "number" ? value : parseFloat(value) || 0,
                },
            },
        ],
    };

    const url = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(TOKEN)}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const out = await res.text();
    console.log("[CAPI] Purchase response:", res.status, out);
    return { status: res.status, out };
}
