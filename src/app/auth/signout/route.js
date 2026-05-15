import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(request) {
    const supabase = await getSupabaseServer();
    await supabase.auth.signOut();
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/`, { status: 303 });
}
