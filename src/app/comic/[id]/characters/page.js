import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ensurePaidDigital } from "@/lib/comic/access";
import { CharacterUploader } from "@/components/comic/CharacterUploader";
import { StudioSheet, StudioHeading } from "@/components/comic/StudioChrome";

export default async function CharactersStepPage({ params }) {
    const { id } = await params;
    await ensurePaidDigital(id, "characters");
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
        <StudioSheet className="p-6 sm:p-10">
            <StudioHeading eyebrow="02 — პერსონაჟები" accent="მონაწილეობს?">
                ვინ
            </StudioHeading>
            <p className="text-center text-sm text-text-mutted max-w-md mx-auto mt-3 mb-10 leading-relaxed">
                ატვირთე თითო პერსონაჟის ერთი ფოტო. AI შეისწავლის სახეს და გამოიყენებს ყველა კადრში.
            </p>

            <CharacterUploader projectId={project.id} initialCharacters={characters || []} />
        </StudioSheet>
    );
}
