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

        // Prepare the payload for Unipay API POST Form
        const payload = {
            MerchantID: merchantId,
            OrderID: orderId,
            Amount: amount,
            Currency: currency,
            Hash: hash,
            SuccessRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
            CancelRedirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
            Language: "KA",
        };

        // We return these details to the frontend so it can construct a hidden form and submit it to Unipay
        return NextResponse.json({
            success: true,
            actionUrl: "https://checkout.unipay.com/", // Unipay's unified checkout URL
            payload
        });
    } catch (error) {
        console.error("Checkout route error:", error);
        return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }
}
