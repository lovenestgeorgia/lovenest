import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ComicCheckout } from "@/components/comic/ComicCheckout";

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
        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 md:p-10">
            <div className="mb-8">
                <h1 className="text-3xl font-serif text-text-dark mb-2">აირჩიე ფორმატი</h1>
                <p className="text-text-mutted text-sm">
                    ციფრულად ჩამოტვირთე ან მიიღე ბეჭდური წიგნი მისამართზე.
                </p>
            </div>

            <ComicCheckout
                projectId={project.id}
                userEmail={user.email}
                hasDigital={project.paid_digital}
                hasPrint={project.paid_print}
            />
        </div>
    );
}
