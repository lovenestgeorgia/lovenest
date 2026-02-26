/**
 * Gemini AI Agent for Lovenest Messenger Bot
 * 
 * Features:
 * - Conversation memory (last 10 messages per user)
 * - Lovenest knowledge base as system prompt
 * - Function calling for order placement
 */

import { LOVENEST_SYSTEM_PROMPT, ORDER_CONFIRMATION_TEMPLATE } from "./knowledge.js";
import { appendOrder } from "./sheets.js";
import { sendOrderNotification } from "./telegram.js";

// In-memory conversation store (resets on cold start — acceptable for serverless)
const conversations = new Map();
const MAX_HISTORY = 20; // 10 pairs of user + assistant messages

// Gemini function declaration for order placement
const ORDER_FUNCTION = {
    name: "place_order",
    description: "გამოიძახე ეს ფუნქცია მხოლოდ მაშინ, როცა მომხმარებელმა დაადასტურა შეკვეთა და ყველა საჭირო ინფორმაცია (სახელი, ტელეფონი, ქალაქი, მისამართი) უკვე მიღებულია.",
    parameters: {
        type: "object",
        properties: {
            name: {
                type: "string",
                description: "მომხმარებლის სახელი და გვარი"
            },
            phone: {
                type: "string",
                description: "მომხმარებლის ტელეფონის ნომერი"
            },
            city: {
                type: "string",
                description: "ქალაქი (მაგ: თბილისი, ბათუმი, ქუთაისი)"
            },
            address: {
                type: "string",
                description: "ზუსტი მისამართი მიწოდებისთვის"
            }
        },
        required: ["name", "phone", "city", "address"]
    }
};

/**
 * Get or create conversation history for a user
 */
function getConversation(senderId) {
    if (!conversations.has(senderId)) {
        conversations.set(senderId, []);
    }
    return conversations.get(senderId);
}

/**
 * Add a message to conversation history
 */
function addMessage(senderId, role, text) {
    const history = getConversation(senderId);
    history.push({ role, parts: [{ text }] });

    // Trim old messages to keep memory manageable
    while (history.length > MAX_HISTORY) {
        history.shift();
    }
}

/**
 * Process a user message and return the AI response
 */
export async function processMessage(senderId, userMessage) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        console.error("[Agent] Missing GEMINI_API_KEY");
        return "ბოდიშს გიხდით, ტექნიკური ხარვეზია. გთხოვთ სცადოთ მოგვიანებით ან მოგვწერეთ ინსტაგრამზე @lovenest.ge 🤍";
    }

    // Add user message to history
    addMessage(senderId, "user", userMessage);

    const history = getConversation(senderId);

    try {
        // Call Gemini API
        const response = await callGemini(GEMINI_API_KEY, history);

        // Check if Gemini wants to call a function
        if (response.functionCall) {
            const orderData = response.functionCall.args;
            console.log("[Agent] Order detected:", orderData);

            // Execute order placement
            const [sheetsOk, telegramOk] = await Promise.all([
                appendOrder(orderData),
                sendOrderNotification(orderData)
            ]);

            console.log(`[Agent] Sheets: ${sheetsOk}, Telegram: ${telegramOk}`);

            // Generate confirmation message
            const confirmationText = ORDER_CONFIRMATION_TEMPLATE(orderData);
            addMessage(senderId, "model", confirmationText);
            return confirmationText;
        }

        // Regular text response
        const aiText = response.text || "ბოდიშს გიხდით, ვერ მოვახერხე პასუხის გენერაცია. სცადეთ თავიდან 🤍";
        addMessage(senderId, "model", aiText);
        return aiText;

    } catch (error) {
        console.error("[Agent] Error processing message:", error);
        return "ბოდიშს გიხდით, ტექნიკური ხარვეზია. გთხოვთ სცადოთ მოგვიანებით 🤍";
    }
}

/**
 * Call Gemini API with conversation history and function calling
 */
async function callGemini(apiKey, history) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const body = {
        system_instruction: {
            parts: [{ text: LOVENEST_SYSTEM_PROMPT }]
        },
        contents: history,
        tools: [{
            function_declarations: [ORDER_FUNCTION]
        }],
        generation_config: {
            temperature: 0.7,
            max_output_tokens: 500,
            top_p: 0.9
        }
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }

    const data = await res.json();

    // Parse the response
    const candidate = data.candidates?.[0];
    if (!candidate) {
        throw new Error("No candidate in Gemini response");
    }

    const part = candidate.content?.parts?.[0];

    if (part?.functionCall) {
        return { functionCall: part.functionCall };
    }

    return { text: part?.text || "" };
}
