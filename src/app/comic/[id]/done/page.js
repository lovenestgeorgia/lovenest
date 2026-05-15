import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseServer } from "@/lib/supabase/server";
import { isDevUser } from "@/lib/comic/access";
import { Download, Truck, Sparkles } from "lucide-react";

export default async function DonePage({ params }) {
    const { id } = await params;
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    const [{ data: project }, { data: orders }] = await Promise.all([
        supabase
            .from("comic_projects")
            .select("id, title, paid_digital, paid_print")
            .eq("id", id)
            .single(),
        supabase
            .from("comic_orders")
            .select("id, type, payment_status, payment_method, amount, created_at, shipping_name")
            .eq("project_id", id)
            .order("created_at", { ascending: false }),
    ]);

    if (!project) notFound();
    const devAccess = isDevUser(user);
    const canDownload = project.paid_digital || devAccess;

    return (
        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 md:p-10 space-y-8">
            <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 text-primary flex items-center justify-center">
                    <Sparkles size={32} />
                </div>
                <h1 className="text-3xl font-serif text-text-dark">გილოცავ! 🎉</h1>
                <p className="text-text-mutted">{project.title}</p>
            </div>

            {canDownload && (
                <a
                    href={`/api/comic/projects/${id}/pdf`}
                    className="elegant-btn w-full inline-flex items-center justify-center gap-2"
                >
                    <Download size={18} /> ჩამოტვირთე PDF
                </a>
            )}

            {project.paid_print && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3">
                    <Truck className="text-amber-600 shrink-0 mt-1" size={20} />
                    <div className="text-sm text-text-dark">
                        <p className="font-semibold mb-1">ბეჭდური წიგნი მზადდება</p>
                        <p className="text-text-mutted">
                            1-3 დღეში ჩვენი გუნდი დაგიკავშირდება მიწოდების დასაზუსტებლად.
                        </p>
                    </div>
                </div>
            )}

            <div>
                <h2 className="font-serif text-lg text-text-dark mb-3">შენი შეკვეთები</h2>
                <ul className="space-y-2">
                    {(orders || []).map((o) => (
                        <li
                            key={o.id}
                            className="bg-rose-50/20 border border-rose-100 rounded-xl px-4 py-3 flex items-center justify-between text-sm"
                        >
                            <div>
                                <span className="font-medium">
                                    {o.type === "digital" ? "ციფრული" : "ბეჭდური"}
                                </span>
                                <span className="text-text-mutted ml-2">
                                    {o.payment_method === "cod" ? "ნაღდი" : "UniPay"} • {o.amount} ₾
                                </span>
                            </div>
                            <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                                    o.payment_status === "paid"
                                        ? "bg-green-100 text-green-700"
                                        : o.payment_status === "failed"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                }`}
                            >
                                {o.payment_status}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="text-center pt-4 border-t border-rose-50">
                <Link href={`/comic/${id}/preview`} className="text-sm text-primary hover:underline">
                    ← გადახედე კომიქსს
                </Link>
            </div>
        </div>
    );
}
