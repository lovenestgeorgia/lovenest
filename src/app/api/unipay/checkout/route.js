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

        // Construct Hash using the standard Unipay format
        // format: MerchantID|Amount|Currency|OrderID|APIKey
        const hashString = `${merchantId}|${amount}|${currency}|${orderId}|${apiKey}`;
        const hash = crypto.createHash('md5').update(hashString).digest("hex");

        // Convert the payload object into query string parameters for a GET redirect
        const queryParams = new URLSearchParams({
            merchantId: merchantId,
            orderId: orderId,
            amount: amount,
            hash: hash,
            currency: currency,
            language: "KA",
            successRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
            cancelRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`
        }).toString();

        // Target the legacy/default unipay transaction gateway
        let redirectUrl = `https://unipay.com/checkout?${queryParams}`;

        return NextResponse.json({
            success: true,
            redirectUrl,
            payload
        });
    } catch (error) {
        console.error("Checkout route error:", error);
        return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }
}
