import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const rawBody = await req.text();
        // Parse Unipay webhook payload
        const data = JSON.parse(rawBody);

        // TODO: Verify Unipay signature here using the API secret key

        // Process order (update DB to paid, send confirmation email, etc)
        console.log("Unipay Webhook received payment confirmation:", data);

        // Trigger our Telegram Notification script
        try {
            // Send HTTP request to our internal API route
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: data.MerchantOrderId || "UNIPAY_TEST_ORDER",
                    customerParams: {
                        firstname: "მომხმარებელი",
                        lastname: "",
                        phone: "სისტემიდან",
                        city: "თბილისი",
                        address: "გადმოცემული მონაცემები"
                    },
                    cartItems: [{ name: "წამიკითხე როცა დაგჭირდები", quantity: 1, price: 39 }],
                    totalAmount: "39.00"
                })
            });
        } catch (botError) {
            console.error("Failed to trigger Telegram bot:", botError);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Unipay Webhook error:", error);
        return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
    }
}
