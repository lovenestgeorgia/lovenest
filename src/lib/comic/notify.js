// Telegram alert helper for operational incidents (pipeline crashes, panel
// timeouts, model failures). Use `notifyFailure` from any server route — it
// no-ops when TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are missing.
//
// Keep the volume low: send ONE message per incident (one per pipeline run,
// one per regenerate call). Don't notify per-panel — the per-incident summary
// already lists which panels failed.

function escapeMarkdownV2(s) {
    if (s == null) return "";
    return String(s).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}

function truncate(s, max = 500) {
    if (!s) return "";
    const str = String(s);
    return str.length <= max ? str : `${str.slice(0, max)}…`;
}

export async function notifyFailure({
    title,
    project,
    user,
    reason,
    details,
    failedPanels, // optional: [{ ord, error }] or count
    totalPanels, // optional: number
}) {
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT = process.env.TELEGRAM_CHAT_ID;
    if (!TOKEN || !CHAT) return;

    const lines = [`🚨 *${escapeMarkdownV2(title || "ჩავარდა")}*`];

    if (project) {
        if (project.title) {
            lines.push(`\n📚 ${escapeMarkdownV2(project.title)}`);
        }
        if (project.id) {
            lines.push(`📦 Project: \`${escapeMarkdownV2(project.id)}\``);
        }
    }

    if (user?.email) {
        lines.push(`👤 ${escapeMarkdownV2(user.email)}`);
    }

    if (reason) {
        lines.push(`\n${escapeMarkdownV2(reason)}`);
    }

    if (Array.isArray(failedPanels) && failedPanels.length > 0) {
        const summary = failedPanels
            .map((p) =>
                p?.ord != null
                    ? `• №${String(p.ord).padStart(2, "0")}${p.error ? `: ${truncate(p.error, 120)}` : ""}`
                    : null
            )
            .filter(Boolean)
            .slice(0, 12); // cap at 12 panel mentions, the rest counted below
        if (summary.length) {
            const escaped = summary
                .map((s) => escapeMarkdownV2(s))
                .join("\n");
            lines.push(`\n${escaped}`);
        }
        if (totalPanels) {
            lines.push(
                `\n_${escapeMarkdownV2(`${failedPanels.length}/${totalPanels} panels failed`)}_`
            );
        }
    } else if (typeof failedPanels === "number" && failedPanels > 0) {
        lines.push(
            `\n_${escapeMarkdownV2(`${failedPanels}${totalPanels ? ` / ${totalPanels}` : ""} panels failed`)}_`
        );
    }

    if (details) {
        lines.push(
            `\n\`\`\`\n${escapeMarkdownV2(truncate(details, 400))}\n\`\`\``
        );
    }

    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT,
                text: lines.join("\n"),
                parse_mode: "MarkdownV2",
                disable_web_page_preview: true,
            }),
        });
    } catch (e) {
        console.warn("[notifyFailure] telegram send failed:", e.message);
    }
}
