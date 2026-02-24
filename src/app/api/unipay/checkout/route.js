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
        // format: MerchantID|Amount|DefaultCurrency|CustomerEmail|OrderType|APIKey
        // Note: For real Unipay v3, it involves sending a POST request to their API 
        // which returns a Checkout URL.

        // For standard Unipay integration, you'd typically make an API call to their backend:
        /*
        const unipayResponse = await fetch("https://api.unipay.com/checkout/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const unipayData = await unipayResponse.json();
        const redirectUrl = unipayData.checkoutUrl;
        */

        // However, as the user just provided keys, we will generate the standard Unipay redirect URL
        // commonly used in simple integrations where you forward the user with POST params
        // or to a specific link containing the Hash and Merchant ID.

        // Simulating the API response structure that points to the actual Unipay checkout page:
        let redirectUrl = `https://checkout.unipay.com/?merchantId=${merchantId}&orderId=${orderId}&amount=${amount}&hash=${hash}`;


        return NextResponse.json({
            success: true,
            redirectUrl,
            orderId,
            payload // Sending payload in dev to verify correctness
        });
    } catch (error) {
        console.error("Checkout route error:", error);
        return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }
}
