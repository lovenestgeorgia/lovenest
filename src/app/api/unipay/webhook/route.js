import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const rawBody = await req.text();
        // Parse Unipay webhook payload
        const data = JSON.parse(rawBody);

        // TODO: Verify Unipay signature here using the API secret key

        // Process order (update DB to paid, send confirmation email, etc)
        console.log("Unipay Webhook received payment confirmation:", data);

        // Extract details from OrderDescription
        let customerParams = {
            name: "მომხმარებელი",
            phone: "",
            city: "",
            address: "",
            personalMessage: ""
        };

        if (data.OrderDescription && data.OrderDescription.startsWith("USER::")) {
            const parts = data.OrderDescription.split("::");
            if (parts.length >= 6) {
                customerParams.name = parts[1] || customerParams.name;
                customerParams.phone = parts[2] || "";
                customerParams.city = parts[3] || "";
                customerParams.address = parts[4] || "";
                customerParams.personalMessage = parts[5] || "";
            }
        }

        // Trigger our Telegram Notification script
        try {
            // Unipay usually sends Status or ErrorMessage
            const paymentStatus = data.Status || data.status || data.errorcode?.toString() || (data.IsSuccess ? "Success" : "Failed") || "Unknown";

            // Send HTTP request to our internal API route
            await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: data.MerchantOrderId || "UNIPAY_TEST_ORDER",
                    customerParams: customerParams,
                    cartItems: [{ name: "წამიკითხე როცა დაგჭირდები", quantity: 1 }],
                    totalAmount: data.OrderPrice || "39.00",
                    status: paymentStatus
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
