import { redirect, notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isDevUser } from "@/lib/comic/access";

const ROUTE_FOR_STATUS = {
    draft: "story",
    interviewing: "story",
    characters: "characters",
    styling: "style",
    generating: "generate",
    preview: "preview",
    paid: "preview",
    fulfilled: "preview",
};

export default async function ProjectIndex({ params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: project } = await supabase
        .from("comic_projects")
        .select("status, paid_digital")
        .eq("id", id)
        .single();

    if (!project) notFound();
    if (!project.paid_digital && !isDevUser(user)) {
        redirect(`/comic/${id}/unlock`);
    }
    redirect(`/comic/${id}/${ROUTE_FOR_STATUS[project.status] || "story"}`);
}
