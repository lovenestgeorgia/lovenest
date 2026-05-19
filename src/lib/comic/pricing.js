// Comic pricing — driven by NEXT_PUBLIC_COMIC_* env vars so the prices can
// be swapped via .env without redeploys.

function num(envValue, fallback) {
    const n = parseFloat(envValue);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

// `digital` is the bundle price (digital download + printed book + shipping).
// `digitalOriginal` is the pre-discount sticker price the UI strikes through
// next to the actual price. Null when no discount is active.
const digital = num(process.env.NEXT_PUBLIC_COMIC_DIGITAL_PRICE, 60);
const digitalOriginalRaw = num(process.env.NEXT_PUBLIC_COMIC_DIGITAL_ORIGINAL, 0);
const digitalOriginal =
    digitalOriginalRaw > digital ? digitalOriginalRaw : null;

export const PRICES = {
    digital,
    digitalOriginal,
    print: num(process.env.NEXT_PUBLIC_COMIC_PRINT_PRICE, 79),
};

export const HAS_DIGITAL_DISCOUNT = digitalOriginal != null;

// Whole-number percent off, rounded down. Used for the "-N%" badge.
export const DIGITAL_DISCOUNT_PERCENT = HAS_DIGITAL_DISCOUNT
    ? Math.floor(((digitalOriginal - digital) / digitalOriginal) * 100)
    : 0;

// Display helpers — keep formatting consistent across the app.
export function formatPrice(amount) {
    return `${amount.toFixed(2)} ₾`;
}
