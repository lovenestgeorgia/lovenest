import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        // EMERGENCY LOG: Did Unipay even hit the webhook?
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            try {
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: "🚨 WEBHOOK TRIGGERED BY UNIPAY!"
                    })
                });
            } catch (e) { }
        }

        // UniPay V2 sends params in the URL query string, V3 sends a JSON body.
        // Merge both so downstream code can read either shape.
        const urlObj = new URL(req.url);
        const queryData = Object.fromEntries(urlObj.searchParams.entries());

        const rawBody = await req.text();
        let bodyData = {};
        if (rawBody) {
            try {
                bodyData = JSON.parse(rawBody);
            } catch (e) {
                bodyData = Object.fromEntries(
                    new URLSearchParams(rawBody).entries()
                );
            }
        }
        const data = { ...queryData, ...bodyData };

        // If this is a comic order, forward to the comic webhook. We detect by
        // either OrderDescription sentinel (V3) or MerchantOrderID prefix (V2).
        const desc = data.OrderDescription || data.orderDescription || "";
        const merchantOrderId =
            data.MerchantOrderID || data.MerchantOrderId || "";
        const isComicOrder =
            desc.startsWith("COMIC::") || merchantOrderId.startsWith("COMIC-");
        if (isComicOrder) {
            console.log("Forwarding comic order to /api/comic/unipay/webhook");
            const proto = req.headers.get("x-forwarded-proto") || "https";
            const host = req.headers.get("host");
            const forwardUrl = `${proto}://${host}/api/comic/unipay/webhook`;
            try {
                const res = await fetch(forwardUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });
                const body = await res.text();
                return new NextResponse(body, {
                    status: res.status,
                    headers: { "Content-Type": "application/json" },
                });
            } catch (err) {
                console.error("Failed to forward comic webhook:", err);
                return NextResponse.json({ error: "forward failed" }, { status: 500 });
            }
        }

        // Process order (update DB to paid, send confirmation email, etc)
        console.log("Unipay Webhook received payment confirmation:", data);

        // Extract details from OrderDescription
        let customerParams = {
            name: "მომხმარებელი",
            phone: "",
            city: "",
            address: "",
            personalMessage: "",
            email: ""
        };

        if (data.OrderDescription && data.OrderDescription.startsWith("USER::")) {
            const parts = data.OrderDescription.split("::");
            if (parts.length >= 6) {
                customerParams.name = parts[1] || customerParams.name;
                customerParams.phone = parts[2] || "";
                customerParams.city = parts[3] || "";
                customerParams.address = parts[4] || "";
                customerParams.personalMessage = parts[5] || "";
                if (parts.length >= 7) customerParams.email = parts[6] || "";
            }
        }

        // Trigger our Telegram Notification script
        try {
            // Unipay usually sends Status or ErrorMessage
            const paymentStatus = data.Status || data.status || data.errorcode?.toString() || (data.IsSuccess ? "Success" : "Failed") || "Unknown";

            const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
            const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

            if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
                const isSuccess = paymentStatus.toLowerCase().includes("success");
                const statusText = isSuccess ? "✅ წარმატებული გადახდა" : `❌ წარუმატებელი/უარყოფილი (${paymentStatus})`;
                const titleEmoji = isSuccess ? "🌟" : "⚠️";

                const message = `
${titleEmoji} **ახალი შეტყობინება Lovenest.ge-დან!** ${titleEmoji}

💳 **სტატუსი**: ${statusText}
📦 **შეკვეთის ID**: #${data.MerchantOrderId || "UNIPAY_TEST_ORDER"}
💰 **თანხა**: ${data.OrderPrice || "19.00"} ₾

👤 **მომხმარებელი**: ${customerParams.name}
📧 **ელ.ფოსტა**: ${customerParams.email || "არ არის მითითებული"}
📞 **ტელეფონი**: ${customerParams.phone}
📍 **ქალაქი/მისამართი**: ${customerParams.city}, ${customerParams.address}
💌 **პერსონალური გზავნილი**: ${customerParams.personalMessage || "არ არის მიუთითებული"}

🛍️ **პროდუქტები**:
- წამიკითხე როცა დაგჭირდები (x1)

🚚 გთხოვთ დაამუშავოთ შეკვეთა რაც შეიძლება მალე!
`;

                const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
                await fetch(telegramUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: message,
                        parse_mode: "Markdown"
                    }),
                });
            } else {
                console.error("Missing Telegram env variables in Webhook.");
            }
        } catch (botError) {
            console.error("Failed to trigger Telegram bot:", botError);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Unipay Webhook error:", error);
        return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
    }
}
