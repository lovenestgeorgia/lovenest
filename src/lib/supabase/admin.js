import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS — only use server-side.
let _admin;

export function getSupabaseAdmin() {
    if (_admin) return _admin;
    _admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
    return _admin;
}
