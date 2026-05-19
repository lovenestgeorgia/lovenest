import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isDevUser } from "@/lib/comic/access";

export const runtime = "nodejs";

async function guard() {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isDevUser(user)) return null;
    return user;
}

export async function PATCH(req, { params }) {
    if (!(await guard()))
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const update = {};
    if (typeof body.active === "boolean") update.active = body.active;
    if (typeof body.description === "string") {
        update.description = body.description.trim().slice(0, 300) || null;
    }
    if (body.expires_at !== undefined) update.expires_at = body.expires_at || null;
    if (body.max_uses !== undefined) {
        update.max_uses =
            body.max_uses == null || body.max_uses === ""
                ? null
                : Math.max(1, Math.floor(Number(body.max_uses)));
    }

    if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: "no fields to update" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin
        .from("comic_promocodes")
        .update(update)
        .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
    if (!(await guard()))
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const { id } = await params;
    const admin = getSupabaseAdmin();
    const { error } = await admin
        .from("comic_promocodes")
        .delete()
        .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
