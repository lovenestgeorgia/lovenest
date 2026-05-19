import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

// Linear step order for the comic creation wizard.
const STEP_ORDER = ["story", "characters", "style", "generate", "preview"];

const STATUS_TO_STEP = {
    draft: "story",
    interviewing: "story",
    characters: "characters",
    styling: "style",
    generating: "generate",
    preview: "preview",
    paid: "preview",
    fulfilled: "preview",
};

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

// Gates a step page on:
//   1. Project paid_digital being true (or dev bypass).
//   2. If `pageStep` is given, the user can only access steps that are at or
//      BEHIND their current project step. Forward jumps are blocked. So a user
//      whose project is in "preview" can revisit /story or /characters to make
//      edits, but a user mid-story can't skip to /generate.
//
// Special case: /generate is reachable from status="styling" (entry from /style),
// because the generate API atomically transitions the project to "generating".
export async function ensurePaidDigital(projectId, pageStep) {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    const dev = isDevUser(user);

    const { data: project } = await supabase
        .from("comic_projects")
        .select("id, status, paid_digital")
        .eq("id", projectId)
        .single();

    if (!project) return null;

    if (!dev && !project.paid_digital) {
        redirect(`/comic/${projectId}/unlock`);
    }

    if (pageStep) {
        const projectStep = STATUS_TO_STEP[project.status] || "story";
        const projectIdx = STEP_ORDER.indexOf(projectStep);
        const pageIdx = STEP_ORDER.indexOf(pageStep);

        // Entry exception: /generate is reachable from /style — the generate
        // API atomically flips status to "generating" on POST.
        const isGenerateEntry = pageStep === "generate" && projectStep === "style";

        // Block forward skips. Backward and at-current are allowed.
        if (!isGenerateEntry && pageIdx > projectIdx) {
            redirect(`/comic/${projectId}/${projectStep}`);
        }
    }

    return project;
}
