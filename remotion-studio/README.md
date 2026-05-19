# remotion-studio

Offline Remotion project that renders the "როგორ მუშაობს" explainer video.
The output is written to `../public/how-it-works.mp4` so the main Next.js app
can embed it as a plain `<video>` (no Remotion runtime ships to the browser).

## Render

```bash
cd remotion-studio
npm install   # one-time, downloads @remotion/cli + headless Chrome
npm run render
```

This produces `../public/how-it-works.mp4` (≈1 MB, 10s, 1280×720, H.264).
Commit the rendered file along with any composition changes so the marketing
site stays in sync.

## Iterate visually

```bash
npm run studio
```

Opens the Remotion Studio at http://localhost:3000 (or next free port) where
you can scrub through frames, tweak the composition, and re-render.

## Files

- `src/HowItWorks.jsx` — the composition (four scenes, see source for details)
- `src/Root.jsx` — registers the composition with Remotion
- `src/index.js` — Remotion entry point (calls `registerRoot`)
- `remotion.config.mjs` — codec + output config defaults
