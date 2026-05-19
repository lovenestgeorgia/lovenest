import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isDevUser } from "@/lib/comic/access";

// Single source of truth for admin access. We reuse the DEV_BYPASS_EMAILS
// allow-list because the merchant is always in that list anyway. If we ever
// need to split the two roles, swap this for a dedicated ADMIN_EMAILS env.
export async function requireAdmin() {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect("/auth/login?redirect=/admin");
    }
    if (!isDevUser(user)) {
        redirect("/");
    }
    return user;
}
