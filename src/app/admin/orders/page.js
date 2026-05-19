import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { OrdersTable } from "@/app/admin/page";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
    const admin = getSupabaseAdmin();
    const { data: orders } = await admin
        .from("comic_orders")
        .select(
            "id, project_id, user_id, type, amount, payment_status, payment_method, shipping_name, shipping_phone, shipping_city, shipping_address, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(500);

    return (
        <div className="space-y-6">
            <h2 className="text-[11px] uppercase tracking-[0.28em] font-mono text-text-mutted/80">
                ყველა შეკვეთა · {(orders || []).length}
            </h2>
            <OrdersTable orders={orders || []} />
        </div>
    );
}
