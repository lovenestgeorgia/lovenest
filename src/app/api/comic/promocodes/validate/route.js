import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PRICES, formatPrice } from "@/lib/comic/pricing";
import {
    validatePromocode,
    PROMOCODE_ERROR_LABELS,
} from "@/lib/comic/promocodes";

export const runtime = "nodejs";

// Customer-facing: "is this code good and what does it bring me down to?"
// Reads only — does not consume the code. Consumption happens at checkout.
export async function POST(req) {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const { code } = await req.json().catch(() => ({}));
    const admin = getSupabaseAdmin();
    const result = await validatePromocode(admin, code, PRICES.digital);

    if (!result.valid) {
        return NextResponse.json(
            {
                valid: false,
                reason: result.reason,
                message:
                    PROMOCODE_ERROR_LABELS[result.reason] ||
                    "პრომოკოდი ვერ შემოწმდა",
            },
            { status: 200 }
        );
    }

    return NextResponse.json({
        valid: true,
        code: result.code,
        discount: result.discount,
        finalAmount: result.finalAmount,
        finalAmountLabel: formatPrice(result.finalAmount),
        discountLabel: formatPrice(result.discount),
    });
}
