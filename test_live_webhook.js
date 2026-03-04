

async function testWebhook() {
    // The URL the user is currently looking at
    const webhookUrl = "https://lovenest-eta.vercel.app/api/unipay/webhook";

    // We mock the Unipay payload
    const mockUnipayData = {
        MerchantOrderId: "TEST_WEBHOOK_001",
        OrderPrice: "1.00",
        Status: "Success",
        IsSuccess: true,
        OrderDescription: "USER::სატესტო ინჟინერი::555123456::თბილისი::სატესტო მისამართი::ეს არის ტესტი"
    };

    console.log("Sending POST to", webhookUrl);

    try {
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(mockUnipayData)
        });

        const responseText = await res.text();
        console.log("Status Code:", res.status);
        console.log("Response Body:", responseText);
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

testWebhook();
