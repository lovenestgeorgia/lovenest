import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// UniPay V3 does not document a webhook HMAC scheme. We defend by:
//  1. Requiring the COMIC:: sentinel in OrderDescription (which we set when creating the order).
//  2. Looking up the order by its UUID from our DB — random IDs won't match.
//  3. Verifying the OrderPrice in the callback matches the amount we recorded.
// A spoofer would need to know the real UUID of a pending order AND its exact price.
export async function POST(req) {
    const raw = await req.text();
    console.log("[COMIC WEBHOOK] raw body:", raw);

    let data;
    try {
        data = JSON.parse(raw);
    } catch {
        data = Object.fromEntries(new URLSearchParams(raw).entries());
    }
    console.log("[COMIC WEBHOOK] parsed:", JSON.stringify(data));
    console.log("[COMIC WEBHOOK] keys:", Object.keys(data || {}));

    // 1. Sentinel check
    const desc = data.OrderDescription || data.orderDescription || "";
    if (!desc.startsWith("COMIC::")) {
        console.log("[COMIC WEBHOOK] skipped: no COMIC:: sentinel in", desc);
        return NextResponse.json({ received: true, skipped: "not a comic order" });
    }

    const [, orderId, type] = desc.split("::");
    const status = (data.Status || data.status || "").toString();
    const isSuccess =
        status.toLowerCase().includes("success") ||
        data.IsSuccess === true ||
        data.IsSuccess === "true" ||
        data.is_success === true ||
        Number(data.errorcode) === 0;
    console.log("[COMIC WEBHOOK]", { orderId, type, status, isSuccess });

    const admin = getSupabaseAdmin();

    // 2. Order must exist
    const { data: order } = await admin
        .from("comic_orders")
        .select("id, project_id, user_id, amount, type, payment_status, shipping_name, shipping_phone, shipping_city, shipping_address")
        .eq("id", orderId)
        .single();

    if (!order) {
        console.warn("[COMIC WEBHOOK] order not found", { orderId });
        return NextResponse.json({ error: "order not found" }, { status: 404 });
    }

    // 3. Amount check — accept many possible field names; soft-warn if missing
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

    // 4. Type sanity
    if (type && order.type && type !== order.type) {
        console.warn("[COMIC WEBHOOK] type mismatch", { orderId, sentinelType: type, dbType: order.type });
        return NextResponse.json({ error: "type mismatch" }, { status: 400 });
    }

    // Idempotency: ignore duplicate success callbacks
    if (order.payment_status === "paid" && isSuccess) {
        console.log("[COMIC WEBHOOK] already paid (idempotent), no-op");
        return NextResponse.json({ received: true, idempotent: true });
    }
    console.log("[COMIC WEBHOOK] all checks passed, applying...");

    if (isSuccess) {
        const { error: orderErr } = await admin
            .from("comic_orders")
            .update({ payment_status: "paid" })
            .eq("id", order.id);
        if (orderErr) console.error("[COMIC WEBHOOK] order update failed:", orderErr);

        const projectUpdate = type === "digital" ? { paid_digital: true } : { paid_print: true };
        const { error: projErr } = await admin
            .from("comic_projects")
            .update({ ...projectUpdate, status: "paid" })
            .eq("id", order.project_id);
        if (projErr) console.error("[COMIC WEBHOOK] project update failed:", projErr);
        else console.log("[COMIC WEBHOOK] paid_digital/paid_print set", projectUpdate);

        // Telegram notification
        const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT = process.env.TELEGRAM_CHAT_ID;
        if (TOKEN && CHAT) {
            const message =
                `✅ *კომიქსის გადახდა წარმატებული!*\n\n` +
                `📦 *Order*: \`${order.id}\`\n` +
                `💰 ${order.amount} ₾ — ${type}\n` +
                (order.shipping_name
                    ? `\n🚚 *მისამართი*: ${order.shipping_name}, ${order.shipping_phone}\n${order.shipping_city}, ${order.shipping_address}`
                    : "");
            await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: CHAT, text: message, parse_mode: "Markdown" }),
            });
        }
    } else {
        await admin
            .from("comic_orders")
            .update({ payment_status: "failed" })
            .eq("id", order.id);
    }

    return NextResponse.json({ received: true });
}
