import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PRICES } from "@/lib/comic/pricing";

export const runtime = "nodejs";

// Limits on user-supplied shipping fields to prevent abuse / log bloat.
const MAX_FIELD = 200;
const clean = (s) =>
    typeof s === "string" ? s.trim().slice(0, MAX_FIELD) : null;

// Escape Telegram MarkdownV1 metacharacters so a customer name like
// "*hack me*" can't break formatting or inject links.
function tgEscape(s) {
    if (!s) return "";
    return String(s).replace(/[`*_[\]()~>#+=|{}.!\\-]/g, "\\$&");
}

export async function POST(req, { params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const { type, paymentMethod, customer } = await req.json();
    if (!["digital", "print"].includes(type)) {
        return NextResponse.json({ error: "invalid type" }, { status: 400 });
    }
    if (!["unipay", "cod"].includes(paymentMethod)) {
        return NextResponse.json({ error: "invalid paymentMethod" }, { status: 400 });
    }
    if (type === "digital" && paymentMethod === "cod") {
        return NextResponse.json({ error: "digital requires UniPay" }, { status: 400 });
    }

    // Load project AND verify ownership explicitly. RLS already filters this for
    // the user-scoped supabase client, but we read user_id so any later admin
    // write can be guarded against IDOR.
    const { data: project } = await supabase
        .from("comic_projects")
        .select("id, title, user_id, paid_digital, paid_print, status")
        .eq("id", id)
        .single();
    if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (project.user_id !== user.id) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Print orders require the digital unlock first (must have generated the comic)
    if (type === "print" && !project.paid_digital) {
        return NextResponse.json(
            { error: "digital unlock required before print order" },
            { status: 400 }
        );
    }

    // Don't double-pay for the same format
    if (type === "digital" && project.paid_digital) {
        return NextResponse.json({ error: "already paid" }, { status: 409 });
    }
    if (type === "print" && project.paid_print) {
        return NextResponse.json({ error: "print already ordered" }, { status: 409 });
    }

    const amount = PRICES[type];
    const admin = getSupabaseAdmin();

    // Normalize + cap user-supplied shipping fields
    const shipping = {
        name: clean(customer?.name),
        phone: clean(customer?.phone),
        city: clean(customer?.city),
        address: clean(customer?.address),
        email: clean(customer?.email),
    };

    // Insert pending order. COD is recorded as pending too — the order is only
    // "paid" once fulfillment actually collects cash from the customer. The
    // merchant manually flips it via admin tooling (or a future admin route).
    const { data: order, error: orderErr } = await admin
        .from("comic_orders")
        .insert({
            project_id: id,
            user_id: user.id,
            type,
            amount,
            payment_method: paymentMethod,
            payment_status: "pending",
            shipping_name: shipping.name,
            shipping_phone: shipping.phone,
            shipping_city: shipping.city,
            shipping_address: shipping.address,
        })
        .select("id")
        .single();

    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });

    // ---- COD print: order is pending until the courier confirms payment ----
    // We do NOT flip paid_print=true here. The order shows up in Telegram so
    // the merchant can manually mark it shipped/paid.
    if (paymentMethod === "cod") {
        await notifyComicOrder({
            order,
            project,
            type,
            amount,
            shipping,
            paymentStatus: "Pending (Cash on Delivery)",
            user,
        });

        return NextResponse.json({ codSuccess: true, orderId: order.id });
    }

    // ---- UniPay: create order, return redirect URL ----
    const merchantId = process.env.UNIPAY_MERCHANT_ID;
    const apiKey = process.env.UNIPAY_API_KEY;
    const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        `https://${req.headers.get("host") || "lovenest.ge"}`;

    const authRes = await fetch("https://apiv2.unipay.com/v3/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchant_id: merchantId, api_key: apiKey }),
    });
    const authData = await authRes.json();
    if (!authData.auth_token) {
        return NextResponse.json({ error: "auth failed" }, { status: 502 });
    }

    const orderPayload = {
        MerchantUser: shipping.email || user.email || "customer@lovenest.ge",
        MerchantOrderID: `COMIC-${order.id}`,
        OrderPrice: amount.toFixed(2),
        OrderCurrency: "GEL",
        OrderName: `Lovenest Comic — ${project.title}`,
        OrderDescription: `COMIC::${order.id}::${type}`,
        SuccessRedirectUrl: Buffer.from(
            `${baseUrl}/comic/${id}/${type === "digital" ? "story" : "done"}`
        ).toString("base64"),
        CancelRedirectUrl: Buffer.from(
            `${baseUrl}/comic/${id}/${type === "digital" ? "unlock" : "checkout"}`
        ).toString("base64"),
        CallBackUrl: Buffer.from(`${baseUrl}/api/comic/unipay/webhook`).toString("base64"),
        Language: "KA",
    };

    const orderRes = await fetch("https://apiv2.unipay.com/v3/api/order/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authData.auth_token}`,
        },
        body: JSON.stringify(orderPayload),
    });

    const orderText = await orderRes.text();
    let unipayData;
    try {
        unipayData = JSON.parse(orderText);
    } catch {
        return NextResponse.json({ error: "gateway invalid format" }, { status: 502 });
    }
    if (!orderRes.ok) {
        return NextResponse.json({ error: unipayData.message || "gateway error" }, { status: orderRes.status });
    }

    console.log("[UniPay create-order response]", JSON.stringify(unipayData, null, 2));

    if (unipayData?.errorcode || (unipayData?.message && !unipayData?.data)) {
        return NextResponse.json(
            {
                error: `UniPay: ${unipayData.message || `error ${unipayData.errorcode}`}`,
                code: unipayData.errorcode,
            },
            { status: 400 }
        );
    }

    const orderHash =
        unipayData?.data?.UnipayOrderHashID ||
        unipayData?.UnipayOrderHashID ||
        unipayData?.data?.OrderHashID ||
        unipayData?.OrderHashID ||
        "";

    // Write the UniPay hash BEFORE returning the redirect URL so the webhook
    // has it available no matter how quickly UniPay calls back.
    await admin
        .from("comic_orders")
        .update({ unipay_order_id: String(orderHash) })
        .eq("id", order.id);

    const redirectUrl = pickRedirectUrl(unipayData) ||
        (orderHash ? `https://apiv2.unipay.com/v3/checkout/${orderHash}` : null);

    if (!redirectUrl) {
        return NextResponse.json(
            {
                error: "no redirect URL",
                debug: {
                    keys: Object.keys(unipayData || {}),
                    dataKeys: unipayData?.data ? Object.keys(unipayData.data) : null,
                    response: unipayData,
                },
            },
            { status: 502 }
        );
    }

    return NextResponse.json({ redirectUrl, orderId: order.id });
}

function pickRedirectUrl(d) {
    if (!d) return null;
    const candidates = [
        d.Checkout, d.CheckoutUrl, d.checkout_url, d.url, d.redirectUrl, d.redirect_url,
        d.PaymentUrl, d.payment_url, d.PaymentURL, d.RedirectUrl,
        d?.data?.Checkout, d?.data?.CheckoutUrl, d?.data?.checkout_url,
        d?.data?.url, d?.data?.redirectUrl, d?.data?.redirect_url,
        d?.data?.PaymentUrl, d?.data?.payment_url, d?.data?.RedirectUrl,
    ];
    return candidates.find((u) => typeof u === "string" && u.startsWith("http")) || null;
}

async function notifyComicOrder({ order, project, type, amount, shipping, paymentStatus, user }) {
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT = process.env.TELEGRAM_CHAT_ID;
    if (!TOKEN || !CHAT) return;

    const safe = {
        title: tgEscape(project.title),
        email: tgEscape(user.email),
        name: tgEscape(shipping?.name),
        phone: tgEscape(shipping?.phone),
        city: tgEscape(shipping?.city),
        address: tgEscape(shipping?.address),
        status: tgEscape(paymentStatus),
    };

    const message =
        `🎨 *ახალი კომიქსის შეკვეთა\\!*\n\n` +
        `📦 *შეკვეთის ID*: \`${order.id}\`\n` +
        `🎭 *პროექტი*: ${safe.title}\n` +
        `📚 *ფორმატი*: ${type === "digital" ? "ციფრული PDF" : "ბეჭდური წიგნი"}\n` +
        `💰 *თანხა*: ${amount} ₾\n` +
        `💳 *სტატუსი*: ${safe.status}\n\n` +
        `👤 *მომხმარებელი*: ${safe.email}\n` +
        (safe.name ? `📝 *სახელი*: ${safe.name}\n` : "") +
        (safe.phone ? `📞 *ტელ\\.*: ${safe.phone}\n` : "") +
        (safe.city ? `📍 *მის\\.*: ${safe.city}, ${safe.address}\n` : "");

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT, text: message, parse_mode: "MarkdownV2" }),
    });
}
