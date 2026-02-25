import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
    try {
        const { name, email, phone, city, address, personalMessage, amount, orderId } = await req.json();

        const merchantId = process.env.UNIPAY_MERCHANT_ID;
        const apiKey = process.env.UNIPAY_API_KEY;

        const protocol = req.headers.get("x-forwarded-proto") || "https";
        const host = req.headers.get("host") || "lovenest-eta.vercel.app";
        // Force the production domain for the webhook callback
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://lovenest-eta.vercel.app";

        // Step 1: Authenticate with UniPay V3 API to get a Bearer token
        const authRes = await fetch("https://apiv2.unipay.com/v3/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                merchant_id: merchantId,
                api_key: apiKey
            })
        });

        const authData = await authRes.json();
        if (!authData.auth_token) {
            console.error("Unipay Auth Failed:", authData);
            return NextResponse.json({ success: false, error: "Payment gateway authentication failed." }, { status: 401 });
        }

        // Step 2: Create the Order
        const orderPayload = {
            MerchantUser: email || "customer@lovenest.ge",
            MerchantOrderID: orderId,
            OrderPrice: typeof amount === 'number' ? amount.toFixed(2) : parseFloat(amount).toFixed(2),
            OrderCurrency: "GEL",
            OrderName: "Lovenest Book Order",
            OrderDescription: `USER::${name}::${phone}::${city}::${address}::${personalMessage || ''}`,
            SuccessRedirectUrl: Buffer.from(`${baseUrl}/success`).toString("base64"),
            CancelRedirectUrl: Buffer.from(`${baseUrl}/cancel`).toString("base64"),
            CallBackUrl: Buffer.from(`${baseUrl}/api/unipay/webhook`).toString("base64"),
            Language: "KA"
        };

        const orderRes = await fetch("https://apiv2.unipay.com/v3/api/order/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authData.auth_token}`
            },
            body: JSON.stringify(orderPayload)
        });

        // We capture text first in case Unipay returns an HTML error (like 403 Forbidden)
        const orderResponseText = await orderRes.text();
        let orderData;
        try {
            orderData = JSON.parse(orderResponseText);
        } catch (e) {
            console.error("Unipay Order Creation returned non-JSON:", orderResponseText);
            return NextResponse.json({ success: false, error: "Payment gateway returned invalid format." }, { status: 502 });
        }

        if (!orderRes.ok) {
            console.error("Unipay Order Error:", orderData);
            return NextResponse.json({ success: false, error: orderData.message || "Payment gateway rejected the order." }, { status: orderRes.status });
        }

        // Return the full Unipay order data to the frontend so the client can extract the generated Checkout URL
        return NextResponse.json({
            success: true,
            unipayData: orderData
        });
    } catch (error) {
        console.error("Checkout route error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
