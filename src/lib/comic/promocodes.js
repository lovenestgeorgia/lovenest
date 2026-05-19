// Promocode lookup + validation. Always uses the service-role admin client so
// it can read comic_promocodes regardless of RLS, but never echoes anything
// the customer doesn't already know about the code they typed.

function normalize(code) {
    return String(code || "").trim().toUpperCase();
}

function computeDiscount(promo, baseAmount) {
    if (promo.discount_type === "percent") {
        return Math.min(baseAmount, (baseAmount * Number(promo.discount_value)) / 100);
    }
    if (promo.discount_type === "fixed") {
        return Math.min(baseAmount, Number(promo.discount_value));
    }
    return 0;
}

// Returns one of:
//   { valid: true, code, promocodeId, discount, finalAmount, discountType, discountValue }
//   { valid: false, reason }
// reasons: 'empty' | 'not_found' | 'inactive' | 'not_yet' | 'expired' | 'exhausted'
//          | 'unavailable' (the table itself errored)
export async function validatePromocode(admin, codeRaw, baseAmount) {
    const code = normalize(codeRaw);
    if (!code) return { valid: false, reason: "empty" };

    const { data, error } = await admin
        .from("comic_promocodes")
        .select("*")
        .eq("code", code)
        .maybeSingle();

    if (error) {
        // Could be a missing table (migration not run yet) — fail closed.
        return { valid: false, reason: "unavailable" };
    }
    if (!data) return { valid: false, reason: "not_found" };
    if (!data.active) return { valid: false, reason: "inactive" };

    const now = Date.now();
    if (data.starts_at && new Date(data.starts_at).getTime() > now) {
        return { valid: false, reason: "not_yet" };
    }
    if (data.expires_at && new Date(data.expires_at).getTime() < now) {
        return { valid: false, reason: "expired" };
    }
    if (data.max_uses != null && data.uses >= data.max_uses) {
        return { valid: false, reason: "exhausted" };
    }

    const discount = computeDiscount(data, baseAmount);
    const finalAmount = Math.max(0, baseAmount - discount);

    return {
        valid: true,
        code: data.code,
        promocodeId: data.id,
        discount: Number(discount.toFixed(2)),
        finalAmount: Number(finalAmount.toFixed(2)),
        discountType: data.discount_type,
        discountValue: Number(data.discount_value),
    };
}

// Atomically increment uses; returns true if the bump succeeded (i.e., the
// code was still available at the moment of redemption). Prevents two
// concurrent users from both consuming a max_uses=1 code.
export async function consumePromocode(admin, promocodeId) {
    // Update gated by uses < max_uses (or unlimited when max_uses is null).
    const { data, error } = await admin.rpc("increment_promocode_uses", {
        promo_id: promocodeId,
    });
    if (!error && data === true) return true;

    // Fallback path if the RPC doesn't exist yet: do the increment in JS with
    // a row-level read first. Not atomic, but cheaper than blocking the
    // checkout. Live with the rare race for now.
    const { data: row } = await admin
        .from("comic_promocodes")
        .select("id, uses, max_uses")
        .eq("id", promocodeId)
        .maybeSingle();
    if (!row) return false;
    if (row.max_uses != null && row.uses >= row.max_uses) return false;

    const { error: upErr } = await admin
        .from("comic_promocodes")
        .update({ uses: row.uses + 1 })
        .eq("id", promocodeId);
    return !upErr;
}

// Friendly Georgian error copy for each refusal reason. The API hands these
// straight to the client so the UI doesn't need its own translation map.
export const PROMOCODE_ERROR_LABELS = {
    empty: "შეიყვანე პრომოკოდი",
    not_found: "ასეთი პრომოკოდი არ მოიძებნა",
    inactive: "პრომოკოდი დროებით გათიშულია",
    not_yet: "პრომოკოდი ჯერ არ მოქმედებს",
    expired: "პრომოკოდი ვადაგასულია",
    exhausted: "პრომოკოდი უკვე გამოყენებულია მაქსიმალურად",
    unavailable: "პრომოკოდი ვერ შემოწმდა, სცადე მოგვიანებით",
};
