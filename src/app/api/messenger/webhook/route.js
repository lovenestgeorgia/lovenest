/**
 * Facebook Messenger Webhook for Lovenest AI Agent
 * 
 * GET  — Meta webhook verification handshake
 * POST — Incoming message handler → Gemini AI → Reply via Send API
 */

import { NextResponse } from "next/server";
import { processMessage } from "@/lib/messenger/agent";

/**
 * GET: Meta Webhook Verification
 * Meta sends hub.mode, hub.verify_token, hub.challenge
 */
export async function GET(req) {
    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("[Messenger Webhook] Verification successful");
        return new Response(challenge, { status: 200 });
    }

    console.error("[Messenger Webhook] Verification failed. Token mismatch.");
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST: Handle incoming messages from Facebook Messenger
 */
export async function POST(req) {
    try {
        const body = await req.json();

        // Facebook sends a test event on subscription — acknowledge immediately
        if (body.object !== "page") {
            return NextResponse.json({ status: "ignored" }, { status: 200 });
        }

        // Process each entry (there can be multiple batched)
        for (const entry of body.entry || []) {
            for (const event of entry.messaging || []) {
                // Only process text messages (ignore reactions, reads, deliveries, etc.)
                if (!event.message?.text) {
                    continue;
                }

                const senderId = event.sender.id;
                const messageText = event.message.text;

                console.log(`[Messenger] Message from ${senderId}: ${messageText}`);

                // Process with AI agent
                const aiResponse = await processMessage(senderId, messageText);

                // Send reply via Messenger Send API
                await sendMessengerReply(senderId, aiResponse);
            }
        }

        // Always return 200 quickly to avoid Meta retries
        return NextResponse.json({ status: "ok" }, { status: 200 });

    } catch (error) {
        console.error("[Messenger Webhook] Error:", error);
        // Still return 200 to prevent Meta from retrying
        return NextResponse.json({ status: "error" }, { status: 200 });
    }
}

/**
 * Send a text reply to a user via the Messenger Send API
 */
async function sendMessengerReply(recipientId, text) {
    const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;

    if (!PAGE_ACCESS_TOKEN) {
        console.error("[Messenger] Missing META_PAGE_ACCESS_TOKEN");
        return;
    }

    // Messenger has a 2000 character limit per message
    // Split long messages if needed
    const chunks = splitMessage(text, 1900);

    for (const chunk of chunks) {
        try {
            const res = await fetch(
                `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        recipient: { id: recipientId },
                        message: { text: chunk },
                        messaging_type: "RESPONSE"
                    })
                }
            );

            if (!res.ok) {
                const errData = await res.text();
                console.error("[Messenger] Send API error:", errData);
            }
        } catch (error) {
            console.error("[Messenger] Failed to send reply:", error);
        }
    }
}

/**
 * Split a long message into chunks that fit Messenger's character limit
 */
function splitMessage(text, maxLength) {
    if (text.length <= maxLength) return [text];

    const chunks = [];
    let remaining = text;

    while (remaining.length > 0) {
        if (remaining.length <= maxLength) {
            chunks.push(remaining);
            break;
        }

        // Try to split at a newline
        let splitIdx = remaining.lastIndexOf("\n", maxLength);
        if (splitIdx < maxLength / 2) {
            // If no good newline, split at space
            splitIdx = remaining.lastIndexOf(" ", maxLength);
        }
        if (splitIdx < maxLength / 2) {
            // Last resort: just cut
            splitIdx = maxLength;
        }

        chunks.push(remaining.substring(0, splitIdx));
        remaining = remaining.substring(splitIdx).trim();
    }

    return chunks;
}
