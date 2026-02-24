import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
    try {
        const { name, phone, address, personalMessage } = await req.json();

        const merchantId = process.env.UNIPAY_MERCHANT_ID;
        const apiKey = process.env.UNIPAY_API_KEY;

        // Configure product details (Static price for the book)
        const orderId = "ORD-" + Date.now();
        const amount = "50.00"; // Assuming the book costs 50 GEL
        const currency = "GEL";

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
            MerchantUser: formData.email || "customer@lovenest.ge",
            MerchantOrderID: orderId,
            OrderPrice: amount,
            OrderCurrency: "GEL",
            OrderName: "Lovenest Order",
            OrderDescription: `Order ${orderId} by ${formData.firstName} ${formData.lastName}`,
            SuccessRedirectUrl: Buffer.from(`${process.env.NEXT_PUBLIC_BASE_URL}/success`).toString("base64"),
            CancelRedirectUrl: Buffer.from(`${process.env.NEXT_PUBLIC_BASE_URL}/cancel`).toString("base64"),
            CallBackUrl: Buffer.from(`${process.env.NEXT_PUBLIC_BASE_URL}/api/unipay/webhook`).toString("base64"),
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
