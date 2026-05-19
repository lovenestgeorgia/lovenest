import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isDevUser } from "@/lib/comic/access";

export const runtime = "nodejs";

async function requireAdminUser() {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isDevUser(user)) return null;
    return user;
}

export async function POST(req) {
    const user = await requireAdminUser();
    if (!user) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim().toUpperCase();
    const discount_type = body.discount_type;
    const discount_value = Number(body.discount_value);
    const max_uses =
        body.max_uses == null || body.max_uses === ""
            ? null
            : Math.max(1, Math.floor(Number(body.max_uses)));
    const expires_at = body.expires_at || null;
    const description =
        typeof body.description === "string" && body.description.trim()
            ? body.description.trim().slice(0, 300)
            : null;

    if (!code || !/^[A-Z0-9_-]{2,40}$/.test(code)) {
        return NextResponse.json(
            { error: "კოდი უნდა იყოს 2-40 სიმბოლო (A-Z, 0-9, _, -)" },
            { status: 400 }
        );
    }
    if (!["percent", "fixed"].includes(discount_type)) {
        return NextResponse.json({ error: "invalid type" }, { status: 400 });
    }
    if (!Number.isFinite(discount_value) || discount_value < 0) {
        return NextResponse.json({ error: "invalid value" }, { status: 400 });
    }
    if (discount_type === "percent" && discount_value > 100) {
        return NextResponse.json({ error: "percent > 100" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
        .from("comic_promocodes")
        .insert({
            code,
            discount_type,
            discount_value,
            max_uses,
            expires_at,
            description,
            created_by: user.id,
        })
        .select("*")
        .single();

    if (error) {
        if (String(error.code) === "23505") {
            return NextResponse.json(
                { error: "ეს კოდი უკვე არსებობს" },
                { status: 409 }
            );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ promocode: data });
}
