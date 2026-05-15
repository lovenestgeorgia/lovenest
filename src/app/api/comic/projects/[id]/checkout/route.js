import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PRICES } from "@/lib/comic/pricing";

export const runtime = "nodejs";

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

    const { data: project } = await supabase
        .from("comic_projects")
        .select("id, title")
        .eq("id", id)
        .single();
    if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

    const amount = PRICES[type];
    const admin = getSupabaseAdmin();

    // Insert pending order via service role (RLS only grants SELECT to users)
    const { data: order, error: orderErr } = await admin
        .from("comic_orders")
        .insert({
            project_id: id,
            user_id: user.id,
            type,
            amount,
            payment_method: paymentMethod,
            payment_status: paymentMethod === "cod" ? "paid" : "pending",
            shipping_name: customer?.name || null,
            shipping_phone: customer?.phone || null,
            shipping_city: customer?.city || null,
            shipping_address: customer?.address || null,
        })
        .select("id")
        .single();

    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });

    // ---- COD print: mark project as paid_print immediately, notify ----
    if (paymentMethod === "cod") {
        await admin
            .from("comic_projects")
            .update({ paid_print: true, status: "paid" })
            .eq("id", id);

        await notifyComicOrder({
            order,
            project,
            type,
            amount,
            customer,
            paymentStatus: "Success (Cash on Delivery)",
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
        MerchantUser: customer?.email || user.email || "customer@lovenest.ge",
        MerchantOrderID: `COMIC-${order.id}`,
        OrderPrice: amount.toFixed(2),
        OrderCurrency: "GEL",
        OrderName: `Lovenest Comic — ${project.title}`,
        // COMIC sentinel lets the dispatcher distinguish from the book product
        OrderDescription: `COMIC::${order.id}::${type}`,
        // Digital purchase = the upfront 15 ₾ unlock → send them to the story step.
        // Print purchase happens after generation → send them to /done to track shipping.
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

    // Surface UniPay-side errors (errorcode + message) so the customer sees the real reason
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

    await admin
        .from("comic_orders")
        .update({ unipay_order_id: String(orderHash) })
        .eq("id", order.id);

    // Try every field name UniPay has ever used for the customer-facing redirect URL.
    const redirectUrl = pickRedirectUrl(unipayData) ||
        // Fallback: construct from OrderHashID if UniPay only returned that
        (orderHash ? `https://apiv2.unipay.com/v3/checkout/${orderHash}` : null);

    if (!redirectUrl) {
        // Return enough detail to debug from the browser network tab
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

async function notifyComicOrder({ order, project, type, amount, customer, paymentStatus, user }) {
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT = process.env.TELEGRAM_CHAT_ID;
    if (!TOKEN || !CHAT) return;

    const message =
        `🎨 *ახალი კომიქსის შეკვეთა!*\n\n` +
        `📦 *შეკვეთის ID*: \`${order.id}\`\n` +
        `🎭 *პროექტი*: ${project.title}\n` +
        `📚 *ფორმატი*: ${type === "digital" ? "ციფრული PDF" : "ბეჭდური წიგნი"}\n` +
        `💰 *თანხა*: ${amount} ₾\n` +
        `💳 *სტატუსი*: ${paymentStatus}\n\n` +
        `👤 *მომხმარებელი*: ${user.email}\n` +
        (customer?.name ? `📝 *სახელი*: ${customer.name}\n` : "") +
        (customer?.phone ? `📞 *ტელ.*: ${customer.phone}\n` : "") +
        (customer?.city ? `📍 *მის.*: ${customer.city}, ${customer.address || ""}\n` : "");

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT, text: message, parse_mode: "Markdown" }),
    });
}
