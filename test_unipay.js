const fs = require('fs');
const crypto = require("crypto");

// Simple parser for .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        env[match[1]] = match[2] ? match[2].trim().replace(/^['"]|['"]$/g, '') : '';
    }
});

async function testUnipay() {
    const merchantId = env.UNIPAY_MERCHANT_ID;
    const apiKey = env.UNIPAY_API_KEY;

    console.log("Using Merchant ID:", merchantId);

    // Step 1: Auth
    console.log("Authenticating...");
    const authRes = await fetch("https://apiv2.unipay.com/v3/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            merchant_id: merchantId,
            api_key: apiKey
        })
    });
    const authData = await authRes.json();
    console.log("Auth Response:", authData);

    if (!authData.auth_token) {
        console.error("Failed to get auth_token");
        return;
    }

    // Step 2: Create Order
    console.log("Creating Order...");
    const orderPayload = {
        MerchantUser: "customer@lovenest.ge",
        MerchantOrderID: "TEST-" + Date.now(),
        OrderPrice: "10.00",
        OrderCurrency: "GEL",
        OrderName: "Test Order",
        OrderDescription: "Test Description",
        SuccessRedirectUrl: Buffer.from("https://lovenest.ge/success").toString("base64"),
        CancelRedirectUrl: Buffer.from("https://lovenest.ge/cancel").toString("base64"),
        CallBackUrl: Buffer.from("https://lovenest.ge/api/unipay/webhook").toString("base64"),
        Language: "KA"
    };

    console.log("Order Payload:", orderPayload);

    const orderRes = await fetch("https://apiv2.unipay.com/v3/api/order/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authData.auth_token}`
        },
        body: JSON.stringify(orderPayload)
    });

    const text = await orderRes.text();
    console.log("Order Creation Raw Response Text:", text);

    try {
        const json = JSON.parse(text);
        console.log("Order Creation JSON Response:", JSON.stringify(json, null, 2));
    } catch (e) {
        // Not json
    }
}

testUnipay();
