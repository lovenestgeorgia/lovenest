import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ComicCheckout } from "@/components/comic/ComicCheckout";
import { StudioSheet, StudioHeading } from "@/components/comic/StudioChrome";

export default async function ComicCheckoutPage({ params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/auth/login?redirect=/comic/${id}/checkout`);

    const { data: project } = await supabase
        .from("comic_projects")
        .select("id, title, paid_digital, paid_print")
        .eq("id", id)
        .single();

    if (!project) notFound();

    return (
        <StudioSheet className="p-6 sm:p-10">
            <StudioHeading eyebrow="06 — შეძენა" accent="ფორმატი">
                აირჩიე
            </StudioHeading>
            <p className="text-center text-sm text-text-mutted max-w-md mx-auto mt-3 mb-10 leading-relaxed">
                ციფრულად ჩამოტვირთე ან მიიღე ბეჭდური წიგნი მისამართზე.
            </p>

            <ComicCheckout
                projectId={project.id}
                userEmail={user.email}
                hasDigital={project.paid_digital}
                hasPrint={project.paid_print}
            />
        </StudioSheet>
    );
}
