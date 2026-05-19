import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Force-confirms a user's email so they can sign in immediately, with no
// confirmation link in their inbox. Called from /auth/register right after
// signUp, and from /auth/login if it returns "Email not confirmed".
//
// We only touch users that exist AND aren't already confirmed — so this
// endpoint is safe to call on any email without leaking whether an account
// exists (response is always 200/ok regardless).
export async function POST(req) {
    const { email } = await req.json().catch(() => ({}));
    if (typeof email !== "string" || !email.includes("@")) {
        return NextResponse.json({ ok: true }, { status: 200 });
    }

    const admin = getSupabaseAdmin();
    try {
        // Supabase admin SDK doesn't expose getUserByEmail directly. Paginate
        // until we find the user, then early-exit. 1000-per-page keeps this
        // to a single API call for any project under ~1000 users.
        let target = null;
        let page = 1;
        const perPage = 1000;
        // Hard ceiling so a malformed response can't infinite-loop.
        while (page <= 50) {
            const { data, error } = await admin.auth.admin.listUsers({
                page,
                perPage,
            });
            if (error) throw error;
            const users = data?.users || [];
            target = users.find(
                (u) => (u.email || "").toLowerCase() === email.toLowerCase()
            );
            if (target) break;
            if (users.length < perPage) break;
            page += 1;
        }

        if (target && !target.email_confirmed_at) {
            await admin.auth.admin.updateUserById(target.id, {
                email_confirm: true,
            });
        }
    } catch (e) {
        console.warn("[auto-confirm] failed:", e?.message || e);
    }

    // Always 200, never leak account existence.
    return NextResponse.json({ ok: true });
}
