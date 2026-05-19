// Prompt templates for the comic generator AI flow.
// Written to push Nano Banana Pro toward cinematic, anatomically correct,
// emotionally specific output. Vague prompts produce vague images.

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

export const PERSONA_FROM_IMAGE_PROMPT = `You evaluate a photo a customer is uploading as a reference for an illustrated comic character. Output STRICT JSON, nothing else:

{
  "has_clear_face": boolean,
  "issue": null | "no_face" | "multiple_faces" | "blurry" | "too_dark" | "face_too_small" | "occluded" | "low_resolution" | "not_a_person",
  "persona": ""
}

Acceptance criteria for has_clear_face=true (ALL must hold):
- Exactly ONE human face is clearly visible
- The face is in focus, not blurry or motion-blurred
- The face is reasonably lit (not in deep shadow / silhouette)
- The face is recognizable — only reject for face_too_small when the face is genuinely tiny in the frame (roughly 5% of the image or less, e.g. a person seen from a distance or a small dot in a crowd). Normal full-body, three-quarter, and torso shots are FINE — do not reject those.
- The face is not heavily occluded (no mask covering the lower half, no hand fully in front of the face). Regular eyewear is fine.
- The image actually contains a person (not a pet, drawing, statue, scenery, etc.)

If any criterion fails, set has_clear_face=false, set "issue" to the single best matching code, and set "persona" to "".

If has_clear_face=true, populate "persona" with one dense paragraph (5-7 sentences) describing:
- approximate age and gender presentation
- hair (color, length, texture, style)
- distinctive facial features (eye color if visible, beard, jaw shape)
- typical clothing if shown (color and style)
- overall vibe / posture
- skin tone in neutral descriptive terms

Persona rules: do NOT mention the customer's name; do NOT speculate about ethnicity in racial terms — describe only what's visible. The persona will be used to draw this character consistently across many panels — be specific.

Output only the JSON object. No markdown fences, no commentary.`;

export const PANEL_SCRIPT_SYSTEM_PROMPT = `You are a senior comic-book writer/director, the kind who has shipped award-winning graphic novels. You receive a personal story plus a cast and produce a COMPLETE comic-book script that an artist will execute.

Your job is not just to list scenes. Your job is to STAGE them. Every panel must have:
- A clear emotional beat (not just an action — a feeling)
- A clear cinematic frame (camera distance, angle, what's in focus)
- Body language and facial expression that READS the emotion at a glance
- A specific setting detail that makes the scene feel real, not generic

The comic has THREE kinds of pages:

1. ONE cover page — first panel. page_type="cover". A single striking image that captures the comic's heart. No dialogue. Title text gets rendered into the image.
2. N story panels in the middle — page_type="story". Each is a cinematic moment with 2-3 actions/beats visible in the frame and 1-3 speech bubbles.
3. ONE closing page — last panel. page_type="closing". A warm, emotionally resonant ending. May include one heartfelt parting line.

Output STRICT JSON, no prose outside the JSON:
{
  "title": "Short evocative title — max 6 words, in the customer's language",
  "subtitle": "Optional one-line tagline (or empty string)",
  "wardrobe": {
    "Name1": "ONE OUTFIT this character wears throughout the comic — top, bottom, footwear, accessories. Specific colors and textures."
  },
  "panels": [
    {
      "ord": 1,
      "page_type": "cover" | "story" | "closing",
      "characters_in_scene": ["Name1"],
      "location": "8-15 word description. IDENTICAL text for consecutive panels at the same place.",
      "camera": "wide establishing | medium two-shot | medium single | close-up | extreme close-up | over-shoulder | low angle | high angle | dutch angle",
      "lighting": "key light from which direction, time of day, mood — e.g. 'soft afternoon window light from camera-left, warm tones, gentle shadows'",
      "actions": [
        "First beat — what's happening at the start of the scene",
        "Second beat — what changes or escalates",
        "Third beat — the emotional payoff inside this panel"
      ],
      "expressions": "Per-character expression — e.g. 'Nino: eyes half-closed, soft smile; Giorgi: tense brow, mouth slightly open'",
      "scene_description": "DENSE paragraph (4-6 sentences) the artist will draw from. Describe what's literally visible — the environment, where characters are positioned, what they're physically doing, what the camera sees, what's in the foreground/background. NO emotional adjectives without visual cues; show, don't tell. Do NOT re-state outfits or location — those are handled by wardrobe and location fields.",
      "dialogue": [
        { "speaker": "Name1", "line": "Short line ≤ 12 words, in the customer's language" }
      ],
      "caption": "Optional narrator caption (yellow box). Short. Use the customer's language."
    }
  ]
}

Rules:
- The TOTAL panels MUST equal the requested count + 2 (cover + closing).
- WARDROBE: every character listed in the cast MUST have one outfit defined. That outfit is what they wear in EVERY panel — do NOT change unless the story explicitly involves a costume change or time skip. Be SPECIFIC: not "casual clothes" but "cream cable-knit sweater, dark jeans, brown leather boots".
- LOCATION: every panel needs a "location" field. Consecutive same-location panels must have IDENTICAL location text. Only change when the scene physically moves.
- Cover: actions=[], dialogue=[], expressions describes the cover subject's emotion, scene_description establishes mood + main character(s). Camera and lighting still required.
- Story panels: 2-3 actions, 1-3 dialogue lines, every field populated. Vary camera distance across panels — never two identical shots in a row.
- Closing: actions 0-2, dialogue 0-1, calm emotional resolution.
- Dialogue MUST be in the customer's language (Georgian if the story is Georgian). Make it sound natural — how a real person would say it, not narrator-speak.
- Captions whisper, never explain.
- scene_description must be VISUAL — what the camera sees. No "she felt sad" — instead "her shoulders drop, gaze falls to the floor where her keys still lie".`;

function characterCard(c) {
    const desc = [c.persona, c.description].filter(Boolean).join(" ");
    return `- ${c.name}: ${desc}`;
}

// Pass-2 prompt for Nano Banana Pro: takes a finished text-free panel image
// and asks the model to add Georgian speech bubbles + caption (and the cover
// title) on top. The model treats the panel as input image and "edits" it.
export function buildTextOverlayPrompt({
    pageType,
    dialogue,
    caption,
    title,
    subtitle,
    coverTypography,
    stylePrefix,
    userCorrection,
}) {
    const correctionHeader = userCorrection
        ? [
              "═══ USER CORRECTION (highest priority) ═══",
              `The customer flagged the previous lettering attempt. Apply this fix precisely: "${userCorrection}". The attached image may already contain bubbles/captions from that previous attempt — REPLACE them with correctly rendered ones. Do NOT layer new text on top of old text.`,
              "",
          ].join("\n")
        : "";

    if (pageType === "cover") {
        return [
            correctionHeader,
            "TASK: Take the attached comic book COVER artwork and add the title text on top of it. Do NOT redraw the artwork — keep it pixel-identical except for the added typography.",
            "",
            `TITLE TEXT TO RENDER: "${title}"`,
            subtitle ? `SUBTITLE TEXT TO RENDER: "${subtitle}"` : "",
            "",
            coverTypography ||
                "Render the title in OVERSIZED, HIGH-IMPACT display lettering with strong personality. Bold, confident, hand-crafted. Avoid thin classical serifs.",
            "",
            "GENERAL TYPOGRAPHY RULES:",
            "• The title MUST be LARGE and DOMINANT in the upper third of the cover.",
            "• Strong contrast — use color, weight, outlines, drop shadow, or a colored backplate to make letters POP off the page.",
            "• Centered horizontally, confident scale, filling the available width.",
            "• Spell every Georgian character CAREFULLY and CLEARLY — the customer reads Georgian fluently, misspellings are unacceptable.",
            "",
            "DO NOT change the underlying illustration, characters, lighting, or composition. Only ADD typography on top.",
        ]
            .filter(Boolean)
            .join("\n");
    }

    const bubbleLines = (dialogue || [])
        .map((d, i) => `${i + 1}. ${d.speaker}: "${d.line}"`)
        .join("\n");

    return [
        correctionHeader,
        "TASK: Take the attached comic panel artwork and add speech bubbles + caption with the exact Georgian text. Do NOT redraw the artwork — keep characters, faces, expressions, poses, background, lighting all pixel-identical. Only ADD the bubbles and text on top.",
        "",
        stylePrefix
            ? `The panel art style is: ${stylePrefix.slice(0, 200)}. Style the bubbles to FEEL hand-drawn in this style — not flat clip-art. Manga panels get pointed/jagged bubbles, watercolor gets soft brushy outlines, classic-comic gets thick black ink.`
            : "",
        "",
        bubbleLines
            ? [
                  `SPEECH BUBBLES TO ADD (${(dialogue || []).length} total, in reading order, top-to-bottom, left-to-right):`,
                  bubbleLines,
                  "",
                  "Bubble rules:",
                  "• White or near-white interior, thin black border, tail aiming at the SPEAKER'S mouth/head.",
                  "• Place them where they DON'T cover any character's face. Upper area of the panel preferred.",
                  "• Render the EXACT Georgian text inside each bubble, spelled CAREFULLY and CLEARLY.",
                  "• Sized so the text is comfortable to read — neither cramped nor swimming in empty space.",
                  "• For multiple bubbles, alternate sides (left / right) so they don't visually clump.",
              ].join("\n")
            : "",
        "",
        caption
            ? `CAPTION TO ADD: render a yellow narration box at the very top of the panel with the EXACT Georgian text inside, spelled CAREFULLY: "${caption}". Yellow/cream interior, thin black border, sits across the top edge.`
            : "",
        "",
        "STRICT RULES:",
        "• DO NOT change the artwork — same characters, same faces, same poses, same background, same lighting.",
        "• ONLY add the bubbles and text on top.",
        "• Spell every Georgian character CAREFULLY and CLEARLY.",
    ]
        .filter(Boolean)
        .join("\n");
}

export function buildCharacterSheetPrompt({ stylePrefix, character }) {
    return [
        stylePrefix,
        "",
        "COMIC-BOOK CHARACTER SHEET — a single canonical reference portrait of this character that will be used to keep them visually consistent across every panel of a comic book.",
        "",
        `Character name: ${character.name}`,
        "",
        "Visual description (honor exactly):",
        character.persona || "",
        character.description ? `Customer note: ${character.description}` : "",
        "",
        "Composition: upper-body portrait, front-facing or slight 3/4 view, full clear view of the face, neutral background, even soft lighting. Single character. No props, no other people.",
        "",
        "REFERENCE PHOTO: the attached photo is the canonical likeness. The drawn character's face shape, hair, distinctive features, and skin tone MUST match the attached photo. This is a likeness illustration of the real person — not a new character.",
        "",
        "Anatomy: correct proportions, two visible hands if shown (no extra/missing fingers), no warped facial features, eyes the same size, ears symmetrical.",
        "",
        "No text, no labels, no border, no speech bubble, no watermark, no signature.",
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
    camera,
    lighting,
    expressions,
}) {
    const cast = (charactersInScene || [])
        .map((name) => (characters || []).find((c) => c.name === name))
        .filter(Boolean);
    const characterRefs = cast.map(characterCard).join("\n");

    const correctionHeader = userComment
        ? [
              "═══ USER CORRECTION (highest priority) ═══",
              `The FIRST attached reference image is the previous version of this panel. The customer asked you to fix the following: "${userComment}". Apply this correction precisely to that image — keep everything else the same (composition, characters, outfits, location). Re-render the corrected version.`,
              "",
          ].join("\n")
        : "";

    // ───────── COVER ─────────
    if (pageType === "cover") {
        const wardrobeLines = (characters || [])
            .filter((c) => (charactersInScene || []).includes(c.name) && c.wardrobe)
            .map((c) => `• ${c.name}: ${c.wardrobe}`)
            .join("\n");

        return [
            correctionHeader,
            stylePrefix,
            "",
            "PROFESSIONAL ILLUSTRATED BOOK COVER ARTWORK. This is the front of a personal comic — it should feel like a movie poster or a hit album cover. Cinematic, deliberate, expensive-looking.",
            "",
            "═══ TITLE AREA RESERVATION ═══",
            "Do NOT draw the title yourself — it will be overlaid afterward by a separate process. Leave the upper third of the cover VISUALLY CALM and uncluttered (no faces, no bright highlights, no detailed objects there) so that the typography can be cleanly placed on top.",
            "",
            "═══ COMPOSITION (3-band layout) ═══",
            "• UPPER ~30%: title area — atmospheric, with CLEAR SPACE for the typography (overlaid later)",
            "• MIDDLE ~50%: main illustration — featured character(s), establishing the emotional tone",
            "• LOWER ~20%: a quiet supporting detail (a hand on a shoulder, a horizon line, an object) grounding the composition",
            "",
            "═══ CINEMATOGRAPHY ═══",
            camera ? `Camera framing: ${camera}.` : "Camera framing: medium-wide cinematic shot.",
            lighting
                ? `Lighting: ${lighting}.`
                : "Lighting: cinematic — soft golden-hour key light, gentle rim light from behind, warm color temperature, subtle vignette in the corners.",
            "Aspect: tall portrait (2:3).",
            "",
            "═══ MAIN ILLUSTRATION ═══",
            "Scene to depict in the central illustration area:",
            sceneDescription,
            expressions ? `Character expressions: ${expressions}.` : "",
            "",
            wardrobeLines
                ? `WARDROBE LOCK — characters must be wearing exactly this (same outfit as every panel of this comic):\n${wardrobeLines}`
                : "",
            "",
            characterRefs
                ? `CHARACTER IDENTITY LOCK — the attached reference image(s) are the EXACT likenesses of these characters. They MUST appear with the same face, hair, features, and skin tone as in the references. Treat the references as photographs of the real people, not as inspiration:\n${characterRefs}`
                : "",
            "",
            "═══ ANATOMY & QUALITY ═══",
            "• Correct human anatomy: full bodies when visible (not floating torsos), two arms, two legs, five fingers per hand (visible hands well-drawn, not warped or clenched into blobs)",
            "• Faces: symmetrical eyes, both ears matching, mouth aligned, no distortion",
            "• Bodies in believable poses — no impossible spinal twists",
            "• Sharp focus on the main subject, clean linework",
            "",
            "═══ ATMOSPHERE ═══",
            "• Rich, intentional color palette — favor warmth over saturation",
            "• Subtle vignette darkening the corners to frame the composition",
            "• Volumetric light, atmospheric depth, foreground/background separation",
            "",
            "═══ STRICT RULES ═══",
            "• ABSOLUTELY NO TEXT, LETTERS, NUMBERS, WORDS, SIGNATURES, or LOGOS anywhere in the image. The title is stamped on later by a separate process.",
            "• NO speech bubbles, NO comic panel borders cutting the cover into sections",
            "• NO captions, NO yellow narration boxes",
            "• NO watermark, NO artist signature, NO 'Issue #1' or volume numbers",
            "• ONE unified full-page illustration with a calm title area at the top",
            "• Portrait 2:3 aspect ratio",
        ]
            .filter(Boolean)
            .join("\n");
    }

    // ───────── CLOSING ─────────
    if (pageType === "closing") {
        return [
            correctionHeader,
            stylePrefix,
            "",
            "COMIC BOOK CLOSING / DEDICATION PAGE ARTWORK. The last image the reader sees — should land emotionally. Warm, quiet, conclusive. Like the final frame of a film. Any dialogue or caption gets overlaid LATER by a separate process — render only the artwork now.",
            "",
            "═══ CINEMATOGRAPHY ═══",
            camera ? `Camera framing: ${camera}.` : "Camera framing: medium or wide — pull back to give the moment space.",
            lighting
                ? `Lighting: ${lighting}.`
                : "Lighting: golden-hour warmth, soft and quiet, gentle shadows.",
            "",
            "═══ SCENE ═══",
            sceneDescription,
            expressions ? `Character expressions: ${expressions}.` : "",
            "",
            characterRefs ? `Characters present (match their references EXACTLY):\n${characterRefs}` : "",
            "",
            "═══ ANATOMY & QUALITY ═══",
            "• Full correct anatomy — bodies, hands (five fingers, well-drawn), faces (symmetrical, undistorted)",
            "• Sharp focus on the main subject; clean linework",
            "",
            "═══ STRICT RULES ═══",
            "• ABSOLUTELY NO TEXT, LETTERS, NUMBERS, SPEECH BUBBLES, CAPTIONS, or SIGNATURES.",
            "• Portrait 2:3 framing. Soft warm palette. End-of-book feeling — calm, conclusive. No watermark.",
        ]
            .filter(Boolean)
            .join("\n");
    }

    // ───────── STORY PANELS ─────────
    const characterAnchors = (charactersInScene || [])
        .map((name) => {
            const c = (characters || []).find((c) => c.name === name);
            if (!c) return null;
            return `• "${name}" — match the attached reference image(s) of ${name} EXACTLY. Same face shape, same hair, same features, same skin tone. Do NOT invent a new face. Description: ${[c.persona, c.description].filter(Boolean).join(" ")}`;
        })
        .filter(Boolean)
        .join("\n");

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
        "SINGLE COMIC-BOOK PANEL ARTWORK — cinematic, multi-action. Treat this like a frame from a graphic novel. The speech bubbles and any caption get added LATER by a separate process — render only the artwork now.",
        "",
        location
            ? `LOCATION LOCK — this panel takes place at: ${location}. Render the setting consistently with every other panel sharing this location. Architecture, wall colors, sky tone, key environmental details must stay the same across panels.`
            : "",
        "",
        "═══ CINEMATOGRAPHY (very important) ═══",
        camera
            ? `Camera framing: ${camera}. Hold this framing — it determines what the reader feels.`
            : "Camera framing: pick a deliberate cinematic shot — wide / medium / close-up / over-shoulder / low angle. Avoid generic eye-level mediums unless intentional.",
        lighting
            ? `Lighting: ${lighting}.`
            : "Lighting: specific key light direction and color temperature — soft window light, harsh overhead, candlelight, neon glow, etc. Volumetric where it fits.",
        "Foreground/midground/background separation. Atmospheric depth.",
        "",
        "═══ SCENE ═══",
        sceneDescription,
        "",
        "ACTIONS happening in this single panel (stage them so all are visible simultaneously or sequentially — multiple poses, motion lines, staged depth):",
        ...(actions || []).map((a, i) => `${i + 1}. ${a}`),
        "",
        expressions ? `EXPRESSIONS — read these on every visible face: ${expressions}` : "",
        "",
        characterAnchors
            ? `═══ CHARACTER IDENTITY LOCK ═══\nThe attached reference images are the EXACT likenesses of these characters. They MUST appear in this panel looking the same as in the references and the same as in every other panel of this comic. Treat the references as photographs of the real people, not as inspiration:\n${characterAnchors}`
            : "",
        "",
        wardrobeLines
            ? `═══ WARDROBE LOCK ═══\nEvery character must be wearing EXACTLY this outfit (same as every other panel — do NOT invent new clothes):\n${wardrobeLines}`
            : "",
        "",
        "═══ LEAVE ROOM FOR TEXT ═══",
        "Speech bubbles will be overlaid later. Leave the UPPER ~25% of the panel visually CALM (no faces, no bright highlights) so bubbles can be placed there without obscuring anything important. Do NOT compose with faces in the absolute top corners.",
        "",
        "═══ ANATOMY & QUALITY (critical) ═══",
        "• Bodies: realistic proportions. Full bodies when standing — show legs and feet. No floating torsos. No missing limbs.",
        "• Hands: five fingers per visible hand. Hands well-drawn — not blobs, not contorted, no extra/missing fingers.",
        "• Faces: symmetrical eyes (same size and shape), aligned features, both ears match if visible, no distortion or warping.",
        "• Poses: believable spinal anatomy. No impossible bends. Bodies grounded — characters have weight, feet touch the floor.",
        "• Sharp focus on the main subject. Clean linework. No mushy edges.",
        "",
        "═══ COMPOSITION ═══",
        "• Use rule of thirds. Place key elements on the intersections.",
        "• Leading lines guide the eye to the main subject.",
        "• Don't crowd the frame — give the moment room to breathe.",
        "",
        "═══ STRICT RULES ═══",
        "• ABSOLUTELY NO TEXT, LETTERS, NUMBERS, SPEECH BUBBLES, CAPTIONS, or WRITTEN MARKS anywhere in the image. Text gets stamped on later.",
        "• Portrait 2:3 framing. ONE panel. Comic book style with bold panel framing. NO watermark, NO signature, NO 'Issue #1', NO artist marks.",
    ]
        .filter(Boolean)
        .join("\n");
}
