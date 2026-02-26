/**
 * Google Sheets Integration for Order Logging
 * 
 * Uses Google Sheets API v4 with a service account.
 * 
 * Required ENV vars:
 *   GOOGLE_SHEETS_CREDENTIALS — Base64-encoded service account JSON
 *   GOOGLE_SHEETS_SPREADSHEET_ID — Google Spreadsheet ID
 */

async function getAccessToken() {
    const credentialsB64 = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!credentialsB64) {
        throw new Error("Missing GOOGLE_SHEETS_CREDENTIALS env variable");
    }

    const credentials = JSON.parse(Buffer.from(credentialsB64, "base64").toString("utf-8"));

    // Build JWT for Google API authentication
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: credentials.client_email,
        scope: "https://www.googleapis.com/auth/spreadsheets",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600
    };

    const { createSign } = await import("crypto");

    const encodeBase64Url = (obj) =>
        Buffer.from(JSON.stringify(obj)).toString("base64url");

    const unsignedToken = `${encodeBase64Url(header)}.${encodeBase64Url(payload)}`;

    const sign = createSign("RSA-SHA256");
    sign.update(unsignedToken);
    const signature = sign.sign(credentials.private_key, "base64url");

    const jwt = `${unsignedToken}.${signature}`;

    // Exchange JWT for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt
        })
    });

    if (!tokenRes.ok) {
        const err = await tokenRes.text();
        throw new Error(`Failed to get access token: ${err}`);
    }

    const tokenData = await tokenRes.json();
    return tokenData.access_token;
}

export async function appendOrder(orderData) {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId) {
        console.error("[Sheets] Missing GOOGLE_SHEETS_SPREADSHEET_ID");
        return false;
    }

    try {
        const accessToken = await getAccessToken();

        const now = new Date().toLocaleString("ka-GE", { timeZone: "Asia/Tbilisi" });

        const values = [[
            now,                               // თარიღი
            orderData.name || "",              // სახელი
            orderData.phone || "",             // ტელეფონი
            orderData.city || "",              // ქალაქი
            orderData.address || "",           // მისამართი
            "წამიკითხე როცა დაგჭირდები",        // პროდუქტი
            "39",                              // ფასი
            "Messenger",                       // წყარო
            "მოლოდინში"                         // სტატუსი
        ]];

        const range = "Sheet1!A:I";
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ values })
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("[Sheets] Failed to append:", err);
            return false;
        }

        console.log("[Sheets] Order appended successfully");
        return true;
    } catch (error) {
        console.error("[Sheets] Error:", error);
        return false;
    }
}
