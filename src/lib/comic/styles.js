// Curated style presets. Each one has a prompt prefix that is injected into
// every panel generation request to keep the comic visually consistent.

export const COMIC_STYLES = [
    {
        id: "romantic-watercolor",
        name: "Romantic Watercolor",
        nameGe: "რომანტიული აკვარელი",
        tagline: "Soft pastel palette, dreamy edges, painterly",
        taglineGe: "რბილი პასტელი, ნაზი კონტურები",
        sample: "/comic-styles/romantic-watercolor.png",
        promptPrefix:
            "Romantic watercolor illustration, soft pastel palette of blush pink, peach and cream, " +
            "delicate wet-on-wet washes, gentle linework, dreamy atmosphere, warm natural light, " +
            "painterly brushstrokes, in the style of a high-end greeting card illustration.",
        coverTypography:
            "Render the title in BOLD HAND-PAINTED DISPLAY LETTERING that pops off the page — generous weight, exaggerated scale, slight irregular brush character. Saturated deep-rose, magenta, or warm gold ink with a soft watercolor bleed and a subtle creamy paper texture behind it. The title should fill the available width confidently — big, romantic, magazine-cover energy. NOT thin, NOT delicate, NOT classical-serif. Think hand-painted shop sign for a boutique, or the title card of a romance film poster.",
    },
    {
        id: "ghibli-esque",
        name: "Ghibli-esque",
        nameGe: "Ghibli-ის სტილი",
        tagline: "Painterly anime, warm light, lush scenes",
        taglineGe: "ანიმე-სამხატვრო, თბილი განათება",
        sample: "/comic-styles/ghibli-esque.png",
        promptPrefix:
            "Painterly anime illustration in the style of a Studio Ghibli film, lush hand-painted backgrounds, " +
            "warm golden-hour lighting, gentle expressive faces, soft cel-shading, cinematic composition, " +
            "rich atmospheric color, whimsical and emotional.",
        coverTypography:
            "Render the title in DRAMATIC ANIME MOVIE-POSTER LETTERING — large, confident, hand-painted display type with painterly weight and a soft inner glow or warm outline. Warm cream or honey-gold core with a deeper amber outline, or deep ink with a soft halo of light behind it. Think of the title cards of major Studio Ghibli films: oversized, atmospheric, instantly readable, impossible to miss. NOT thin, NOT delicate.",
    },
    {
        id: "manga-bw",
        name: "Manga (B&W)",
        nameGe: "მანგა (შავ-თეთრი)",
        tagline: "Clean line art, screentones, dramatic",
        taglineGe: "კალიგრაფიული ხაზები, კონტრასტული",
        sample: "/comic-styles/manga-bw.png",
        promptPrefix:
            "Black and white manga illustration, clean confident line art, expressive faces, " +
            "screentone shading, dramatic angles, dynamic paneling sensibility, high contrast ink, " +
            "no color, professional manga studio quality.",
        coverTypography:
            "Render the title in MASSIVE HAND-PAINTED BRUSH CALLIGRAPHY — extremely thick irregular ink strokes, dripping with energy, like the title of a hit shōnen manga volume. Pure black ink, maybe one letter struck through with a bold crimson slash or a screentone-grey backplate. Oversized — the title should DOMINATE the upper third. Wild, expressive, never delicate.",
    },
    {
        id: "classic-comic",
        name: "Classic Comic Book",
        nameGe: "კლასიკური კომიქსი",
        tagline: "Bold ink, halftone dots, vivid color",
        taglineGe: "მკაფიო ხაზები, ნათელი ფერები",
        sample: "/comic-styles/classic-comic.png",
        promptPrefix:
            "Classic American comic book illustration, bold black ink outlines, flat saturated colors, " +
            "Ben-Day halftone dot shading, dynamic poses, expressive faces, vivid color palette, " +
            "in the style of a 1990s comic book panel.",
        coverTypography:
            "Render the title in MAXIMUM-IMPACT COMIC-BOOK DISPLAY LETTERING — huge, slightly tilted, hand-inked letterforms with THICK black outlines and a saturated flat fill (cherry red, royal blue, sunburst yellow). Chunky muscular display caps with a hard chiseled drop shadow behind in a contrasting color. Maybe a starburst or burst-ray accent behind one word. Vintage Marvel/DC cover energy turned up to 11 — instantly grabs the eye.",
    },
    {
        id: "storybook",
        name: "Storybook",
        nameGe: "საბავშვო წიგნი",
        tagline: "Gouache, warm, picture-book charm",
        taglineGe: "გვაშის სტილი, თბილი ფერები",
        sample: "/comic-styles/storybook.png",
        promptPrefix:
            "Children's storybook illustration, gouache and pencil texture, warm cozy palette, " +
            "rounded charming character design, soft natural lighting, gentle composition, " +
            "in the style of a modern award-winning picture book.",
        coverTypography:
            "Render the title in OVERSIZED CHUNKY HAND-LETTERED STORYBOOK TYPE — extra-bold rounded letterforms with playful irregularity, painted in gouache with a slight cream highlight on top and a deeper shadow on the bottom edge of each letter (giving it dimension). Saturated honey-orange, deep teal, or rich plum. Drop in one drawn ornament (a tiny star, a heart, a leaf) tucked into the lettering. The title should feel hand-painted, fat, warm, and impossible to overlook.",
    },
    {
        id: "minimalist-flat",
        name: "Minimalist Flat",
        nameGe: "მინიმალისტური",
        tagline: "Flat colors, simple shapes, modern",
        taglineGe: "ბრტყელი ფერები, მარტივი ფორმები",
        sample: "/comic-styles/minimalist-flat.png",
        promptPrefix:
            "Modern minimalist flat illustration, simple geometric shapes, limited muted color palette, " +
            "no outlines, clean negative space, expressive but stylized characters, " +
            "in the style of contemporary editorial illustration.",
        coverTypography:
            "Render the title in MASSIVE GEOMETRIC SANS-SERIF — ultra-bold, condensed-tall or wide-and-stretched, completely filling the available width. A single saturated accent color from the palette (deep teal, hot terracotta, or saturated mustard) on cream, OR cream letters knocked out of a saturated color block. Maybe one letter outlined instead of filled for a layered pop-art effect. NO ornaments — the type IS the design. Confident editorial-poster energy.",
    },
];

export function getStyleById(id) {
    return COMIC_STYLES.find((s) => s.id === id) || null;
}
