/**
 * Telegram Notification Module for Messenger Orders
 */

export async function sendOrderNotification(orderData) {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error("[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
        return false;
    }

    const message = `
🛒 **ახალი შეკვეთა მესენჯერიდან!** 🛒

📦 **პროდუქტი**: წამიკითხე როცა დაგჭირდები
💰 **ფასი**: 39 ₾

👤 **სახელი**: ${orderData.name}
📞 **ტელეფონი**: ${orderData.phone}
📍 **ქალაქი**: ${orderData.city}
🏠 **მისამართი**: ${orderData.address}
📱 **წყარო**: Facebook Messenger
🕐 **თარიღი**: ${new Date().toLocaleString("ka-GE", { timeZone: "Asia/Tbilisi" })}

⚡ გთხოვთ დაუკავშირდეთ მომხმარებელს და გაუგზავნეთ გადახდის ლინკი!
`;

    try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: "Markdown"
            })
        });

        if (!res.ok) {
            console.error("[Telegram] Failed to send:", await res.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error("[Telegram] Error sending notification:", error);
        return false;
    }
}
