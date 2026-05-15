// Comic pricing — driven by NEXT_PUBLIC_COMIC_* env vars so test (0.01 ₾) and
// production (15 ₾ / 79 ₾) can be swapped via .env without code changes.

function num(envValue, fallback) {
    const n = parseFloat(envValue);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const PRICES = {
    digital: num(process.env.NEXT_PUBLIC_COMIC_DIGITAL_PRICE, 15),
    print: num(process.env.NEXT_PUBLIC_COMIC_PRINT_PRICE, 79),
};

// Display helpers — keep formatting consistent across the app.
export function formatPrice(amount) {
    return `${amount.toFixed(2)} ₾`;
}
