// Comic pricing — single source of truth. Edit these constants to change the
// price; tokens are the only thing that lives in env vars.
//
// `digital` is the bundle price (digital download + printed book + shipping).
// `digitalOriginal` is the pre-discount sticker price the UI strikes through
// next to the current price (set to null to hide the strikethrough).
const digital = 60;
const digitalOriginalRaw = 90;
const digitalOriginal =
    digitalOriginalRaw > digital ? digitalOriginalRaw : null;

export const PRICES = {
    digital,
    digitalOriginal,
    // Legacy stand-alone print price. Not offered to customers in the bundle
    // flow but kept on the table so the API enums still resolve.
    print: 0,
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
