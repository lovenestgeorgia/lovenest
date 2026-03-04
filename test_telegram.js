

const TELEGRAM_BOT_TOKEN = "8718463448:AAEtwCttaU7Zupeon7VgfwYSY2Aw_lrij1o";
const TELEGRAM_CHAT_ID = "5367688344";

async function testTelegram() {
    const message = `
🌟 **სატესტო შეტყობინება!** 🌟

💳 **სტატუსი**: ბოტი წარმატებით დაუკავშირდა
📦 **შეკვეთის ID**: #TEST-00001
💰 **თანხა**: 50.00 ₾

👤 **მომხმარებელი**: ირაკლი გელოვანი
📞 **ტელეფონი**: 555 123 456
📍 **ქალაქი/მისამართი**: თბილისი, სატესტო ქუჩა #1
💌 **პერსონალური გზავნილი**: მიყვარხარ!

🛍️ **პროდუქტები**:
- წამიკითხე როცა დაგჭირდები (x1)

🚚 გთხოვთ დაამუშავოთ შეკვეთა რაც შეიძლება მალე!
`;

    console.log("Sending message to Telegram...");

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(telegramUrl, {
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

    const data = await res.json();
    console.log("Response:", data);
}

testTelegram();
