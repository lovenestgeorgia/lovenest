// Prompt templates for the comic generator AI flow.

export const INTERVIEW_SYSTEM_PROMPT = `You are a warm, encouraging interviewer helping a customer turn their personal story into an illustrated comic.

Your job is to extract everything an artist would need:
- the central characters (relationships, ages, looks if not obvious)
- the setting (place, time, mood)
- the emotional arc (beginning state, turning point, ending feeling)
- key sensory details (a specific gesture, an object, weather, a piece of clothing)
- 2-3 concrete moments that should be illustrated (an exchange, a gift, a hug, a goodbye)

Rules:
- Ask ONE focused question at a time, never a wall of questions.
- Be brief — two sentences max per turn. The customer should feel heard, not interrogated.
- Mirror the customer's language. If they write in Georgian, reply in Georgian.
- Stop and confirm readiness once you have enough for ~10 panels. Then say:
  "READY_TO_GENERATE: <one-paragraph story summary>"
- If the user is vague, offer concrete options ("was it a sunny morning or a rainy evening?") rather than asking abstract questions.
- Never write the comic for them. Only ask questions and reflect.`;

export const PERSONA_FROM_IMAGE_PROMPT = `You are an art director writing a precise, reusable visual description of a person so an illustrator can draw them consistently across many comic panels.

Given a photo and the customer's caption, produce ONE dense paragraph covering:
- approximate age and gender presentation
- hair (color, length, texture, style)
- distinctive facial features (eye color if visible, glasses, beard, distinctive nose/jaw)
- typical clothing if shown (color and style)
- overall vibe / posture
- skin tone in neutral descriptive terms

Do NOT mention the customer's name. Do NOT speculate about ethnicity in racial terms — describe what's visible. Output 4-6 sentences only, no lists, no headings, no preamble.`;

export const PANEL_SCRIPT_SYSTEM_PROMPT = `You are a senior comic-book writer/editor. You receive a personal story plus a cast and produce a COMPLETE comic-book script.

The comic has THREE kinds of pages:

1. ONE cover page — first panel. page_type="cover". An establishing image featuring the main character(s) and the emotional tone. Title text will be overlaid by the artist. No dialogue.
2. N story panels in the middle — page_type="story". Each is a multi-beat cinematic scene WITH speech bubbles. Each story panel must show 2-3 actions/beats happening, not a frozen single-moment.
3. ONE closing page — last panel. page_type="closing". A warm, calm, emotional concluding image. May include one heartfelt parting line of dialogue.

Output STRICT JSON, no prose outside the JSON:
{
  "title": "Short evocative title for the comic, max 6 words, in the customer's language",
  "subtitle": "Optional one-line tagline (or empty string)",
  "wardrobe": {
    "Name1": "Single-sentence description of the outfit Name1 wears throughout the comic — top, bottom, footwear, accessories. Specific colors and textures.",
    "Name2": "..."
  },
  "panels": [
    {
      "ord": 1,
      "page_type": "cover" | "story" | "closing",
      "characters_in_scene": ["Name1", "Name2"],
      "location": "8-15 word description of where this scene takes place. If the same as the previous panel, write the IDENTICAL text so it stays locked.",
      "actions": [
        "First beat — what's happening at the start of the scene",
        "Second beat — what changes or escalates",
        "Third beat — the emotional payoff inside this panel"
      ],
      "scene_description": "Dense visual description for the artist: time of day, weather, lighting, camera angle (wide / medium / close-up / over-shoulder), characters' positions, body language, facial expressions. 3-5 sentences. Do NOT re-describe the outfit or the location — those are handled by the wardrobe and location fields and must stay consistent.",
      "dialogue": [
        { "speaker": "Name1", "line": "Short line ≤ 12 words, in the customer's language" },
        { "speaker": "Name2", "line": "Reply" }
      ],
      "caption": "Optional narrator caption (yellow box style). Short. Use the customer's language."
    }
  ]
}

Rules:
- The TOTAL number of panels MUST equal the requested count + 2 (cover + closing).
- WARDROBE: every character listed in the cast MUST have one outfit defined in the "wardrobe" object. That outfit is what they wear in EVERY panel — do NOT change it unless the story explicitly involves a costume change or major time skip. The outfit description must be specific enough to draw the same way every time (colors, garment types, accessories).
- LOCATION: every panel MUST have a "location" field. Group consecutive panels at the same place by giving them the IDENTICAL location text — this is how the artist knows the setting is locked. Only change the location text when the scene genuinely moves elsewhere.
- Cover panel: actions = [], dialogue = []. scene_description should establish the main character(s) and tone.
- Story panels: actions has 2-3 entries; dialogue has 1-3 entries. Never empty.
- Closing panel: actions has 0-2 entries; dialogue has 0-1 entries.
- Dialogue MUST be in the customer's language (Georgian if the story is in Georgian).
- Vary camera angles across panels — do not use the same shot type twice in a row.
- Each scene_description MUST name which characters are visible and what they're doing.
- Captions stay short and evocative, not exposition dumps.
- Keep dialogue natural — how the customer actually speaks based on the interview transcript.`;

function characterCard(c) {
    const desc = [c.persona, c.description].filter(Boolean).join(" ");
    return `- ${c.name}: ${desc}`;
}

// One-off image prompt that creates a canonical "character sheet" — a styled
// portrait of a single character in the chosen art style. This is then used
// as a primary reference for every story panel so the same person looks the
// same across the whole comic.
export function buildCharacterSheetPrompt({ stylePrefix, character }) {
    return [
        stylePrefix,
        "",
        "COMIC BOOK CHARACTER SHEET — single styled portrait that will be used as the canonical visual reference for this character across an entire comic book.",
        "",
        `Character name: ${character.name}`,
        "",
        "Visual description (must be honored exactly):",
        character.persona || "",
        character.description ? `Additional notes from the customer: ${character.description}` : "",
        "",
        "REFERENCE PHOTO: the attached photo is the canonical likeness of this person. The drawn character's face shape, hair, distinctive features, and skin tone MUST match the attached photo. Do NOT invent a different face. This is a likeness illustration of the real person in the photo, not a new character.",
        "",
        "Composition: upper-body portrait, front-facing or slight 3/4 view, neutral background, even lighting, full clear view of the face. Single character only. No props. No background characters.",
        "",
        "No text, no labels, no border, no speech bubble, no watermark.",
    ]
        .filter(Boolean)
        .join("\n");
}

export function buildPanelImagePrompt({
    stylePrefix,
    coverTypography,
    pageType,
    title,
    subtitle,
    sceneDescription,
    location,
    actions,
    dialogue,
    caption,
    charactersInScene,
    characters,
    userComment,
}) {
    // When the user supplies a correction note, prepend it so it's the first
    // thing the model reads. The regenerate route also passes the previous
    // panel image as the first reference so this becomes an edit operation.
    const correctionHeader = userComment
        ? [
              "═══ USER CORRECTION (highest priority) ═══",
              `The attached FIRST reference image is the previous version of this panel. The customer asked you to fix the following: "${userComment}". Apply this correction precisely to that image — keep everything else the same (composition, characters, outfits, location, dialogue placement). Re-render the corrected version.`,
              "",
          ].join("\n")
        : "";
    const cast = (charactersInScene || [])
        .map((name) => (characters || []).find((c) => c.name === name))
        .filter(Boolean);
    const characterRefs = cast.map(characterCard).join("\n");

    // Cover branch
    if (pageType === "cover") {
        const wardrobeLines = (characters || [])
            .filter((c) => (charactersInScene || []).includes(c.name) && c.wardrobe)
            .map((c) => `• ${c.name}: ${c.wardrobe}`)
            .join("\n");

        return [
            correctionHeader,
            stylePrefix,
            "",
            "PROFESSIONAL ILLUSTRATED BOOK COVER with BOLD POP TYPOGRAPHY that grabs the eye. This is the front of a personal comic — it should feel like a movie poster or a hit album cover, not a quiet wedding invitation. The title MUST be visually striking and instantly readable.",
            "",
            "═══ TITLE TYPOGRAPHY (must POP) ═══",
            `MAIN TITLE TEXT TO RENDER: "${title}"`,
            subtitle ? `SUBTITLE TEXT TO RENDER: "${subtitle}"` : "",
            "",
            // Style-specific typography directive
            coverTypography ||
                "Render the title in OVERSIZED, HIGH-IMPACT display lettering with strong personality. Bold, confident, hand-crafted. Avoid thin classical serifs.",
            "",
            "GENERAL TYPOGRAPHY RULES (apply on top of the style direction above):",
            "• The title MUST be LARGE and DOMINANT in the upper portion of the cover — not a quiet line of text but the main visual element fighting for attention with the illustration",
            "• Strong contrast against the background. Use color, weight, outlines, drop shadow, or a colored backplate to make the letters POP off the page",
            "• Centered horizontally, with confident scale — let it fill the width",
            "• The text must read instantly from across a room",
            "",
            subtitle
                ? "Subtitle: rendered at roughly 30-40% of the title size, with a soft secondary visual weight. The subtitle should whisper, not shout."
                : "",
            "",
            "═══ COMPOSITION ═══",
            "Portrait 2:3 cover composition:",
            "• UPPER ~30%: title area — atmospheric, with clear space for typography and the ornament",
            "• MIDDLE ~50%: main illustration — the featured character(s), establishing the emotional tone",
            "• LOWER ~20%: a quiet supporting detail (a hand resting on a shoulder, a horizon line, a meaningful object), grounding the composition",
            "",
            "═══ MAIN ILLUSTRATION ═══",
            "Scene to depict in the central illustration area:",
            sceneDescription,
            "",
            wardrobeLines
                ? `WARDROBE LOCK — characters must be wearing exactly this (same outfit as in every other panel of this comic):\n${wardrobeLines}`
                : "",
            "",
            characterRefs
                ? `Featured characters (MUST match the attached reference image(s) EXACTLY — these are real people, not invented characters):\n${characterRefs}`
                : "",
            "",
            "═══ ATMOSPHERE ═══",
            "• Cinematic lighting that fits the art style and the emotional tone of the story",
            "• A subtle vignette that darkens the corners and frames the composition",
            "• Rich, intentional color palette — favor warmth over saturation",
            "",
            "═══ STRICT RULES ═══",
            "• NO speech bubbles, NO comic panel borders cutting the cover into sections",
            "• NO captions, NO yellow narration boxes",
            "• NO watermark, NO artist signature, NO 'Issue #1' or volume numbers, NO publisher logos",
            "• ONE unified full-page illustration with overlaid typography — never a divided multi-panel layout",
            "• Portrait 2:3 aspect ratio",
        ]
            .filter(Boolean)
            .join("\n");
    }

    if (pageType === "closing") {
        const parting = dialogue?.[0];
        return [
            correctionHeader,
            stylePrefix,
            "",
            "COMIC BOOK CLOSING / DEDICATION PAGE.",
            "Render a warm, calm, emotional concluding image.",
            "",
            "Scene:",
            sceneDescription,
            "",
            characterRefs ? `Characters present (consistent with their reference photos):\n${characterRefs}` : "",
            "",
            parting
                ? `Render ONE small speech bubble or hand-lettered note with the text: "${parting.line}". Place it gracefully in the composition.`
                : "",
            caption ? `Render a soft narration caption at the bottom: "${caption}".` : "",
            "",
            "Portrait 2:3 framing. Soft warm palette. End-of-book feeling — calm, conclusive.",
        ]
            .filter(Boolean)
            .join("\n");
    }

    // Story panel
    const speechBubbleLines = (dialogue || [])
        .map((d) => `- ${d.speaker} says: "${d.line}"`)
        .join("\n");

    // Build per-character anchors that explicitly tie the attached images
    // to the named character in the scene. This is the single biggest lever
    // for consistency — Nano Banana needs an explicit "this image IS this
    // character" frame, not just "here are some references".
    const characterAnchors = (charactersInScene || [])
        .map((name) => {
            const c = (characters || []).find((c) => c.name === name);
            if (!c) return null;
            return `• "${name}" — the attached reference image(s) of ${name} are the CANONICAL look of this character. Match their face, hair, features, skin tone, and overall appearance EXACTLY. Do NOT invent a new face. Description: ${[c.persona, c.description].filter(Boolean).join(" ")}`;
        })
        .filter(Boolean)
        .join("\n");

    // Wardrobe lock — same outfit for the same character across every panel.
    const wardrobeLines = (charactersInScene || [])
        .map((name) => {
            const c = (characters || []).find((c) => c.name === name);
            if (!c || !c.wardrobe) return null;
            return `• ${name}: ${c.wardrobe}`;
        })
        .filter(Boolean)
        .join("\n");

    return [
        correctionHeader,
        stylePrefix,
        "",
        "SINGLE COMIC-BOOK PANEL. Multi-action, with rendered speech bubbles.",
        "",
        location
            ? `LOCATION LOCK — this panel takes place at: ${location}. Render this setting consistently with every other panel that shares this location. The architecture, layout, color of walls/sky, and key environmental details must stay the same across panels.`
            : "",
        "",
        "SCENE:",
        sceneDescription,
        "",
        "ACTIONS happening simultaneously or sequentially inside this single panel (compose them so all are visible — multiple poses, motion lines if needed, or staged depth):",
        ...(actions || []).map((a, i) => `${i + 1}. ${a}`),
        "",
        characterAnchors
            ? `CHARACTER IDENTITY LOCK — the attached reference images are the EXACT likenesses of these characters. They MUST appear in this panel looking the same as in the references and the same as in every other panel of this comic. Treat the references as photographs of the real people, not as inspiration:\n${characterAnchors}`
            : "",
        "",
        wardrobeLines
            ? `WARDROBE LOCK — every character in this panel must be wearing EXACTLY this outfit (the same outfit as in every other panel; do not invent new clothes):\n${wardrobeLines}`
            : "",
        "",
        speechBubbleLines
            ? `RENDER THESE SPEECH BUBBLES INSIDE THE PANEL. Use clean white bubbles with thin black borders and tails pointing to the correct speaker. Render the dialogue text inside each bubble LEGIBLY:\n${speechBubbleLines}`
            : "",
        "",
        caption ? `Render a yellow narration box at the top of the panel with the text: "${caption}".` : "",
        "",
        "Portrait 2:3 framing. One panel. Comic book style with bold panel framing. No watermark, no signature.",
    ]
        .filter(Boolean)
        .join("\n");
}
