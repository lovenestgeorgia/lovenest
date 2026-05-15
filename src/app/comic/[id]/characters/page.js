import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ensurePaidDigital } from "@/lib/comic/access";
import { CharacterUploader } from "@/components/comic/CharacterUploader";

export default async function CharactersStepPage({ params }) {
    const { id } = await params;
    await ensurePaidDigital(id);
    const supabase = await getSupabaseServer();

    const [{ data: project }, { data: characters }] = await Promise.all([
        supabase.from("comic_projects").select("id, story_text").eq("id", id).single(),
        supabase
            .from("comic_characters")
            .select("id, name, description, persona, reference_image_url")
            .eq("project_id", id)
            .order("created_at", { ascending: true }),
    ]);

    if (!project) notFound();

    return (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 md:p-10">
            <div className="mb-8">
                <h1 className="text-3xl font-serif text-text-dark mb-2">ვინ მონაწილეობს?</h1>
                <p className="text-text-mutted text-sm">
                    ატვირთე თითო პერსონაჟის ერთი ფოტო — ჩვენი AI შეისწავლის სახეს და გამოიყენებს ყველა კადრში.
                </p>
            </div>

            <CharacterUploader projectId={project.id} initialCharacters={characters || []} />
        </div>
    );
}
