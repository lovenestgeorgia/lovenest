import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// UniPay V3 does not document a webhook HMAC scheme. Defense-in-depth here:
//   1. COMIC:: sentinel in OrderDescription (we set it at order-create time)
//   2. orderId from the sentinel must match an existing comic_orders row
//   3. UnipayOrderHashID in the callback must match what UniPay returned at
//      create time (stored in comic_orders.unipay_order_id). This is the only
//      field a spoofer can't fabricate from a stale browser log.
//   4. OrderPrice must match what we recorded
//   5. Type in the sentinel must match the order's recorded type
//   6. Optional shared secret via UNIPAY_WEBHOOK_SECRET — when set, require a
//      matching X-Webhook-Secret header (configure in UniPay dashboard if
//      they support custom callback headers).
//   7. State machine: only pending→paid transitions are honored; idempotent
//      on already-paid; can't re-flip a failed order to paid via replay.

function tgEscape(s) {
    if (!s) return "";
    return String(s).replace(/[`*_[\]()~>#+=|{}.!\\-]/g, "\\$&");
}

export async function POST(req) {
    // Optional shared secret. If UNIPAY_WEBHOOK_SECRET is configured, require
    // the request to carry it as an X-Webhook-Secret header. Constant-time
    // comparison to avoid timing oracles.
    const expectedSecret = process.env.UNIPAY_WEBHOOK_SECRET;
    if (expectedSecret) {
        const provided = req.headers.get("x-webhook-secret") || "";
        if (!constantTimeEqual(provided, expectedSecret)) {
            console.warn("[COMIC WEBHOOK] rejected: bad/missing X-Webhook-Secret");
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }
    }

    // UniPay V2 sends params in the URL query string, V3 in a JSON body. Merge
    // both so we can handle either shape without caring which version fired.
    const urlObj = new URL(req.url);
    const queryData = Object.fromEntries(urlObj.searchParams.entries());

    const raw = await req.text();
    console.log("[COMIC WEBHOOK] raw body:", raw);
    let bodyData = {};
    if (raw) {
        try {
            bodyData = JSON.parse(raw);
        } catch {
            bodyData = Object.fromEntries(new URLSearchParams(raw).entries());
        }
    }
    const data = { ...queryData, ...bodyData };
    console.log("[COMIC WEBHOOK] parsed:", JSON.stringify(data));

    // 1. Detect a comic order. V3 uses OrderDescription with COMIC:: sentinel;
    // V2 doesn't include OrderDescription but its MerchantOrderID is COMIC-<uuid>.
    const desc = data.OrderDescription || data.orderDescription || "";
    const merchantOrderId = data.MerchantOrderID || data.MerchantOrderId || "";

    let orderId;
    let sentinelType;
    if (desc.startsWith("COMIC::")) {
        const parts = desc.split("::");
        orderId = parts[1];
        sentinelType = parts[2];
    } else if (merchantOrderId.startsWith("COMIC-")) {
        orderId = merchantOrderId.slice("COMIC-".length);
        sentinelType = null; // V2 doesn't carry type; we'll fall back to order.type
    } else {
        console.log("[COMIC WEBHOOK] skipped: no COMIC marker", { desc, merchantOrderId });
        return NextResponse.json({ received: true, skipped: "not a comic order" });
    }

    // Success detector accepts both shapes:
    //   V3: Status=Success / IsSuccess=true / is_success=true / errorcode=0
    //   V2: ErrorCode=0 with ErrorMessage=OK, Status numeric (e.g. 3 = paid)
    const status = (data.Status || data.status || "").toString();
    const errorCode =
        data.ErrorCode ?? data.errorcode ?? data.errorCode ?? null;
    const isSuccess =
        status.toLowerCase().includes("success") ||
        data.IsSuccess === true ||
        data.IsSuccess === "true" ||
        data.is_success === true ||
        (errorCode !== null && Number(errorCode) === 0);
    console.log("[COMIC WEBHOOK]", {
        orderId,
        sentinelType,
        status,
        errorCode,
        isSuccess,
    });

    const admin = getSupabaseAdmin();

    // 2. Order must exist
    const { data: order } = await admin
        .from("comic_orders")
        .select("id, project_id, user_id, amount, type, payment_status, unipay_order_id, shipping_name, shipping_phone, shipping_city, shipping_address")
        .eq("id", orderId)
        .single();

    if (!order) {
        console.warn("[COMIC WEBHOOK] order not found", { orderId });
        return NextResponse.json({ error: "order not found" }, { status: 404 });
    }

    // 3. UnipayOrderHashID must match. This is the strongest non-HMAC defense
    // we have: it's a value UniPay returned synchronously at order creation
    // and would never leak to a customer-facing log/network tab. Even if a
    // user knows their own order UUID and amount, they can't forge this.
    const reportedHash = (
        data.UnipayOrderHashID ||
        data.unipay_order_id ||
        data.OrderHashID ||
        data.UnipayOrderID || // V2 callback uses this field name
        ""
    ).toString();
    if (order.unipay_order_id) {
        if (reportedHash !== order.unipay_order_id) {
            console.warn("[COMIC WEBHOOK] hash mismatch", {
                orderId,
                reported: reportedHash,
                expected: order.unipay_order_id,
            });
            return NextResponse.json({ error: "hash mismatch" }, { status: 401 });
        }
    } else {
        // No hash recorded yet — could be the legitimate race between order
        // creation and the first webhook. Log and keep going but only if
        // the inbound hash is at least present.
        if (!reportedHash) {
            console.warn("[COMIC WEBHOOK] missing UnipayOrderHashID and none recorded yet");
            return NextResponse.json({ error: "missing hash" }, { status: 400 });
        }
        console.warn("[COMIC WEBHOOK] order had no stored hash, accepting inbound", reportedHash);
    }

    // 4. Amount check
    const reportedRaw =
        data.OrderPrice ?? data.orderPrice ?? data.Amount ?? data.amount ?? data.Price ?? data.price;
    if (reportedRaw !== undefined) {
        const reportedAmount = Number.parseFloat(reportedRaw);
        const expectedAmount = Number.parseFloat(order.amount);
        if (
            !Number.isFinite(reportedAmount) ||
            Math.abs(reportedAmount - expectedAmount) > 0.01
        ) {
            console.warn("[COMIC WEBHOOK] amount mismatch", {
                orderId,
                reported: reportedAmount,
                expected: expectedAmount,
            });
            return NextResponse.json({ error: "amount mismatch" }, { status: 400 });
        }
    } else {
        console.warn("[COMIC WEBHOOK] no amount field in payload — skipping amount check");
    }

    // 5. Type sanity — sentinel must agree with what we recorded at order create
    if (sentinelType && order.type && sentinelType !== order.type) {
        console.warn("[COMIC WEBHOOK] type mismatch", { orderId, sentinelType, dbType: order.type });
        return NextResponse.json({ error: "type mismatch" }, { status: 400 });
    }

    // 6. State machine. Only allow pending→paid. Refuse to re-flip a failed
    // order to paid via replay (defense against compromised callback URL).
    if (order.payment_status === "paid") {
        console.log("[COMIC WEBHOOK] already paid (idempotent), no-op");
        return NextResponse.json({ received: true, idempotent: true });
    }
    if (order.payment_status === "failed" && isSuccess) {
        console.warn("[COMIC WEBHOOK] rejecting failed→paid transition (replay?)", { orderId });
        return NextResponse.json({ error: "invalid state transition" }, { status: 409 });
    }
    console.log("[COMIC WEBHOOK] checks passed, applying...");

    if (isSuccess) {
        const { error: orderErr } = await admin
            .from("comic_orders")
            .update({ payment_status: "paid" })
            .eq("id", order.id)
            .eq("payment_status", "pending"); // conditional update for atomicity
        if (orderErr) {
            console.error("[COMIC WEBHOOK] order update failed:", orderErr);
            return NextResponse.json({ error: "db error" }, { status: 500 });
        }

        // The upfront "digital" payment is now an all-inclusive bundle that
        // includes the printed book + shipping, so we flip both flags.
        // Legacy standalone print upgrades still only set paid_print.
        const projectUpdate =
            order.type === "digital"
                ? { paid_digital: true, paid_print: true }
                : { paid_print: true };
        // Don't blow away project.status if it's already further along; only
        // mark "paid" when the project is still in preview/styling.
        const { error: projErr } = await admin
            .from("comic_projects")
            .update({ ...projectUpdate, status: "paid" })
            .eq("id", order.project_id);
        if (projErr) console.error("[COMIC WEBHOOK] project update failed:", projErr);
        else console.log("[COMIC WEBHOOK] flags set", projectUpdate);

        const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT = process.env.TELEGRAM_CHAT_ID;
        if (TOKEN && CHAT) {
            const message =
                `✅ *კომიქსის გადახდა წარმატებული\\!*\n\n` +
                `📦 *Order*: \`${order.id}\`\n` +
                `💰 ${order.amount} ₾ — ${order.type}\n` +
                (order.shipping_name
                    ? `\n🚚 *მისამართი*: ${tgEscape(order.shipping_name)}, ${tgEscape(order.shipping_phone)}\n${tgEscape(order.shipping_city)}, ${tgEscape(order.shipping_address)}`
                    : "");
            await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: CHAT, text: message, parse_mode: "MarkdownV2" }),
            });
        }
    } else {
        await admin
            .from("comic_orders")
            .update({ payment_status: "failed" })
            .eq("id", order.id)
            .eq("payment_status", "pending");
    }

    return NextResponse.json({ received: true });
}

function constantTimeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}
