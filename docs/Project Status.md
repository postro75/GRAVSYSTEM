# GRAVSYSTEM — Project Status

## Current state

GRAVSYSTEM is a browser-based AI DAW. The latest Phase 16 shipped side-chain kick ducking, the first real WAM instrument plugin (Synth-101), and a backend offline-render prototype using DawDreamer. The app is live on Vercel and all tests pass.

## What works now

- **Text-to-project generation** from Polish/English descriptions.
- **5 style presets** with matched photography and artist references (Jarre, Kavinsky, Guetta, Ambient, Techno).
- **Browser playback** via Tone.js — drums, bass, pads, leads, arps, FX with per-track mixer and insert effects.
- **Kick-driven side-chain ducking** with style-aware curves for club styles.
- **Real WAM instrument support** (Synth-101 SH-101 clone) behind `NEXT_PUBLIC_ENABLE_WAM=true`.
- **DAW editing** — piano roll, step sequencer, automation lanes, track volume/pan/mute/solo, instrument picker, side-chain toggle.
- **Exports** — `.mid`, `.rpp` (REAPER), `.wav` offline render, JSON project import/export, and backend DawDreamer render prototype.
- **Project persistence** in `localStorage` with project manager.
- **50 vitest tests** green + lint/type-check clean.

## Latest phase

**Phase 16 — Side-Chain Ducking, Real WAM Plugin, Backend Render Prototype** (done)

- Kick-driven side-chain ducking with per-style curves (techno/house/synthwave/ambient/Jarre).
- Real WAM instrument integration: Synth-101 (Roland SH-101 clone) loaded and playable behind feature flag.
- Lazy-loaded `@webaudiomodules/sdk` so tests stay jsdom-compatible.
- Backend offline-render prototype via `apps/api/render_dawdreamer.py` with MIDI fallback.
- Deterministic music-theory test fix.

See `docs/Phase 16 ROI Critique.md` for full details.

## Environment variables

```bash
# Optional — only needed for Pro Render (Stable Audio) endpoint
STABLE_AUDIO_API_KEY=sk-...

# Optional — enables experimental WAM instrument plugins in the browser
NEXT_PUBLIC_ENABLE_WAM=true
```

Without the Stable Audio key the endpoint returns 503 with a clear message.

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
