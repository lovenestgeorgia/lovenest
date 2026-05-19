import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PromocodeCreator } from "@/components/admin/PromocodeCreator";
import { PromocodeRow } from "@/components/admin/PromocodeRow";

export const dynamic = "force-dynamic";

export default async function AdminPromocodesPage() {
    const admin = getSupabaseAdmin();
    const { data: codes, error } = await admin
        .from("comic_promocodes")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-12">
            <section>
                <h2 className="text-[11px] uppercase tracking-[0.28em] font-mono text-text-mutted/80 mb-5">
                    ახალი პრომოკოდი
                </h2>
                <PromocodeCreator />
            </section>

            <section>
                <h2 className="text-[11px] uppercase tracking-[0.28em] font-mono text-text-mutted/80 mb-5">
                    არსებული პრომოკოდები · {(codes || []).length}
                </h2>

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                        ცხრილი ვერ წაიკითხა: {error.message}. გაუშვი მიგრაცია
                        <span className="font-mono"> 006_promocodes.sql </span>
                        Supabase-ში.
                    </p>
                )}

                {(codes || []).length === 0 && !error ? (
                    <p className="text-text-mutted italic py-10 text-center border-y border-rose-100">
                        ჯერ არცერთი პრომოკოდი არ შექმნილა.
                    </p>
                ) : (
                    <div className="overflow-x-auto -mx-6 px-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-[0.22em] font-mono text-text-mutted/70 text-left border-b border-rose-100">
                                    <th className="py-3 pr-4 font-medium">კოდი</th>
                                    <th className="py-3 pr-4 font-medium">ფასდაკლება</th>
                                    <th className="py-3 pr-4 font-medium">გამოყენება</th>
                                    <th className="py-3 pr-4 font-medium">ვადა</th>
                                    <th className="py-3 pr-4 font-medium">სტატუსი</th>
                                    <th className="py-3 pr-4 font-medium hidden lg:table-cell">
                                        შენიშვნა
                                    </th>
                                    <th className="py-3 pr-4 font-medium" />
                                </tr>
                            </thead>
                            <tbody>
                                {(codes || []).map((c) => (
                                    <PromocodeRow key={c.id} code={c} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
