const crypto = require("crypto");

async function test() {
    const merchantId = "5015994027001";
    const apiKey = "941088ff-465e-4021-bee8-8a1067d689ed";

    // Step 1: Authenticate
    const authRes = await fetch("https://apiv2.unipay.com/v3/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            merchant_id: merchantId,
            api_key: apiKey
        })
    });

    const authData = await authRes.json();
    console.log("Auth Data:", authData);
    if (!authData.auth_token) return;

    // Step 2: Create Order
    const orderPayload = {
        MerchantUser: "customer@lovenest.ge",
        MerchantOrderID: "ORD-TEST-" + Date.now(),
        OrderPrice: "50.00",
        OrderCurrency: "GEL",
        OrderName: "Lovenest Order",
        OrderDescription: `Order test by Dev`,
        SuccessRedirectUrl: Buffer.from(`http://localhost:3000/success`).toString("base64"),
        CancelRedirectUrl: Buffer.from(`http://localhost:3000/cancel`).toString("base64"),
        CallBackUrl: Buffer.from(`http://localhost:3000/api/unipay/webhook`).toString("base64"),
        Language: "KA"
    };

    const orderRes = await fetch("https://apiv2.unipay.com/v3/api/order/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authData.auth_token}`
        },
        body: JSON.stringify(orderPayload)
    });

    const text = await orderRes.text();
    console.log("Order Res status:", orderRes.status);
    console.log("Order Res body:", text);
}

test();
