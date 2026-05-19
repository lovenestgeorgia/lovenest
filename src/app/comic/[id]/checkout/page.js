import { notFound, redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

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

    // Bundle pricing: the upfront 90 ₾ already covers digital + print.
    // If the user paid (paid_digital=true), there's nothing left to checkout —
    // send them to /done. If they haven't paid, send them back to /unlock.
    if (project.paid_digital) {
        redirect(`/comic/${id}/done`);
    }
    redirect(`/comic/${id}/unlock`);
}
