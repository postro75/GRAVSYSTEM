# GRAVSYSTEM — Project Status

## Current state

GRAVSYSTEM is a browser-based AI DAW. The latest Phase 15 shipped a professional sound and UX overhaul. The app is live on Vercel, all tests pass, and the codebase is ready for the next wave of features (WAM plugins, side-chain, backend render).

## What works now

- **Text-to-project generation** from Polish/English descriptions.
- **5 style presets** with matched photography and artist references (Jarre, Kavinsky, Guetta, Ambient, Techno).
- **Browser playback** via Tone.js — drums, bass, pads, leads, arps, FX with per-track mixer and insert effects.
- **DAW editing** — piano roll, step sequencer, automation lanes, track volume/pan/mute/solo, instrument picker.
- **Exports** — `.mid`, `.rpp` (REAPER), `.wav` offline render, and JSON project import/export.
- **Project persistence** in `localStorage` with project manager.
- **46 vitest tests** green + lint/type-check clean.

## Latest phase

**Phase 15 — Professional Sound & UX Overhaul** (done)

- Rewrote synthetic drum kit (weighted kick, snare body+wires, band-passed hats, multi-burst clap).
- Added style-specific synths (Jarre bass/pad/brass, Kavinsky bass/lead/arp, Guetta lead/chords).
- Style-aware master FX chain (reverb/delay/compression tuned per style).
- Richer chord progressions with `add9/maj7/sus4` and slash-chord support.
- Less repetitive bass/arp patterns with phrase variation.
- Cleaner instrument picker (category icons, style filters, descriptions).
- Macro slider tooltips and improved step-sequencer beat markers.
- WAM host research stub for browser plugin integration.

See `docs/Phase 15 ROI Critique.md` for full details.

## Environment variables

```bash
# Optional — only needed for Pro Render (Stable Audio) endpoint
STABLE_AUDIO_API_KEY=sk-...
```

Without the key the endpoint returns 503 with a clear message.

## Test & build

```bash
npm run ci        # lint + type-check + test
npm run build     # Next.js production build
```

## Deploy

```bash
vercel --prod --yes
```

## Links

- Repo: https://github.com/postro75/GRAVSYSTEM
- Production: https://gravsystem.vercel.app
