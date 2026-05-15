import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { CHARACTER_BUCKET } from "@/lib/comic/storage";

export async function DELETE(_req, { params }) {
    const { id, charId } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const { data: existing } = await supabase
        .from("comic_characters")
        .select("id, reference_image_path, project_id")
        .eq("id", charId)
        .eq("project_id", id)
        .single();

    if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

    if (existing.reference_image_path) {
        await getSupabaseAdmin()
            .storage.from(CHARACTER_BUCKET)
            .remove([existing.reference_image_path]);
    }

    await supabase.from("comic_characters").delete().eq("id", charId);
    return NextResponse.json({ ok: true });
}
