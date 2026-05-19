import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ensurePaidDigital } from "@/lib/comic/access";
import { InterviewChat } from "@/components/comic/InterviewChat";
import { StudioSheet, StudioHeading } from "@/components/comic/StudioChrome";

export default async function StoryStepPage({ params }) {
    const { id } = await params;
    await ensurePaidDigital(id, "story");
    const supabase = await getSupabaseServer();

    const [{ data: project }, { data: messages }] = await Promise.all([
        supabase.from("comic_projects").select("id, title, story_text, status").eq("id", id).single(),
        supabase
            .from("comic_messages")
            .select("id, role, content, created_at")
            .eq("project_id", id)
            .order("created_at", { ascending: true }),
    ]);

    if (!project) notFound();

    return (
        <StudioSheet className="p-6 sm:p-10">
            <StudioHeading eyebrow="01 — ისტორია" accent="ისტორია">
                გვიამბე შენი
            </StudioHeading>
            <p className="text-center text-sm text-text-mutted max-w-md mx-auto mt-3 mb-10 leading-relaxed">
                დაიწყე ნებისმიერი დეტალით — ვინ, სად, როდის. AI გკითხავს დანარჩენს.
            </p>

            <InterviewChat
                projectId={project.id}
                initialMessages={messages || []}
                initialStory={project.story_text || ""}
            />
        </StudioSheet>
    );
}
