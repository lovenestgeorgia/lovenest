import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "PLACEHOLDER_TOKEN";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "PLACEHOLDER_CHAT_ID";

export async function POST(req) {
    try {
        const data = await req.json();
        const { orderId, customerParams, cartItems, totalAmount } = data;

        // 1. Create message text
        const message = `
🌟 **ახალი შეკვეთა გენერირდა Lovenest.ge-ზე!** 🌟

💳 **სტატუსი**: წარმატებული გადახდა
📦 **შეკვეთის ID**: #${orderId}
💰 **თანხა**: ${totalAmount} ₾

👤 **მომხმარებელი**: ${customerParams.firstname} ${customerParams.lastname}
📞 **ტელეფონი**: ${customerParams.phone}
📍 **ქალაქი/მისამართი**: ${customerParams.city}, ${customerParams.address}

🛍️ **პროდუქტები**:
${cartItems.map(item => `- ${item.name} (x${item.quantity}) - ${item.price}₾`).join('\n')}

🚚 გთხოვთ დაამუშავოთ შეკვეთა რაც შეიძლება მალე!
`;

        // 2. Send to Telegram
        if (TELEGRAM_BOT_TOKEN !== "PLACEHOLDER_TOKEN") {
            const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
            await fetch(telegramUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: "Markdown"
                }),
            });
        } else {
            console.log("Telegram notification skipped: No Token Configured", message);
        }

        // NOTE: For Email integration (if needed), you would use nodemailer here 
        // to send an SMTP email. Telegram is usually enough and much faster for immediate alerts.

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Notification Error:", error);
        return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 });
    }
}
