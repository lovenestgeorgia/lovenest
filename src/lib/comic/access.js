import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

// Comma-separated env list of emails that bypass the 15 ₾ paywall.
// Used for the team / dev / support accounts.
function devBypassEmails() {
    return (process.env.DEV_BYPASS_EMAILS || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
}

export function isDevUser(user) {
    if (!user?.email) return false;
    return devBypassEmails().includes(user.email.toLowerCase());
}

// Pages downstream of the paywall call this early to enforce 15 ₾ upfront payment.
// Returns the project if accessible, otherwise redirects to /unlock.
export async function ensurePaidDigital(projectId) {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    // Dev / admin bypass — full access without payment
    if (isDevUser(user)) {
        const { data: project } = await supabase
            .from("comic_projects")
            .select("id, paid_digital")
            .eq("id", projectId)
            .single();
        return project;
    }

    const { data: project } = await supabase
        .from("comic_projects")
        .select("id, paid_digital")
        .eq("id", projectId)
        .single();

    if (!project) return null;
    if (!project.paid_digital) {
        redirect(`/comic/${projectId}/unlock`);
    }
    return project;
}
