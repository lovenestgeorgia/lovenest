import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ensurePaidDigital } from "@/lib/comic/access";
import { InterviewChat } from "@/components/comic/InterviewChat";

export default async function StoryStepPage({ params }) {
    const { id } = await params;
    await ensurePaidDigital(id);
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
        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 md:p-10">
            <div className="mb-8">
                <h1 className="text-3xl font-serif text-text-dark mb-2">გვიამბე შენი ისტორია</h1>
                <p className="text-text-mutted text-sm">
                    დაიწყე ნებისმიერი დეტალით — ვინ, სად, როდის. ჩვენი AI გკითხავს დანარჩენს.
                </p>
            </div>

            <InterviewChat
                projectId={project.id}
                initialMessages={messages || []}
                initialStory={project.story_text || ""}
            />
        </div>
    );
}
