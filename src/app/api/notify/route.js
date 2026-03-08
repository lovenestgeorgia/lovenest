import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "PLACEHOLDER_TOKEN";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "PLACEHOLDER_CHAT_ID";

// Google Sheets Credentials from Environment
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function POST(req) {
    try {
        const data = await req.json();
        const { orderId, customerParams, cartItems, totalAmount, status } = data;

        // Determine emoji and text based on status
        const isSuccess = status && status.toLowerCase().includes("success");
        const statusText = isSuccess ? "✅ წარმატებული" : `❌ უარყოფილი (${status || "უცნობი"})`;
        const titleEmoji = isSuccess ? "🌟" : "⚠️";

        // 1. Create message text
        const message = `
${titleEmoji} **ახალი შეტყობინება Lovenest.ge-დან!** ${titleEmoji}

💳 **სტატუსი**: ${statusText}
📦 **შეკვეთის ID**: #${orderId}
💰 **თანხა**: ${totalAmount} ₾

👤 **მომხმარებელი**: ${customerParams.name}
📞 **ტელეფონი**: ${customerParams.phone}
📍 **ქალაქი/მისამართი**: ${customerParams.city}, ${customerParams.address}
💌 **პერსონალური გზავნილი**: ${customerParams.personalMessage || "არ არის მიუთითებული"}

🛍️ **პროდუქტები**:
${cartItems.map(item => `- ${item.name} (x${item.quantity})`).join('\n')}

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

        // 3. Send to Google Sheets
        if (GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_SHEET_ID) {
            try {
                const auth = new google.auth.GoogleAuth({
                    credentials: {
                        client_email: GOOGLE_CLIENT_EMAIL,
                        private_key: GOOGLE_PRIVATE_KEY,
                    },
                    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
                });

                const sheets = google.sheets({ version: 'v4', auth });

                // Format data for sheet
                const dateNum = new Date().toLocaleString("ka-GE", { timeZone: "Asia/Tbilisi" });
                const itemsStr = cartItems.map(item => `${item.name} (x${item.quantity})`).join(', ');
                const methodStr = status && status.toLowerCase().includes("cash on delivery") ? "Cash on Delivery" : "Unipay";

                const rowData = [
                    dateNum,
                    orderId || "",
                    customerParams.name || "",
                    `'${customerParams.phone || ""}`,
                    customerParams.city || "",
                    customerParams.address || "",
                    itemsStr,
                    methodStr,
                    `${totalAmount} ₾`,
                    statusText,
                    customerParams.personalMessage || ""
                ];

                // Get spreadsheet details to extract the exact name of the first tab
                const spreadsheetResponse = await sheets.spreadsheets.get({
                    spreadsheetId: GOOGLE_SHEET_ID,
                });

                // Use the title of the first sheet
                const firstSheetTitle = spreadsheetResponse.data.sheets[0].properties.title;
                const rangeName = `'${firstSheetTitle}'!A:K`;

                await sheets.spreadsheets.values.append({
                    spreadsheetId: GOOGLE_SHEET_ID,
                    range: rangeName,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: [rowData],
                    },
                });
                console.log("Successfully appended to Google Sheets in tab:", firstSheetTitle);
            } catch (sheetError) {
                console.error("Google Sheets Error:", sheetError);
            }
        } else {
            console.log("Google Sheets notification skipped: Missing env variables");
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Notification Error:", error);
        return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 });
    }
}
