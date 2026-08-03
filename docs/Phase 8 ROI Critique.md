# Phase 8 ROI Critique — GRAVSYSTEM

## Delivered in this phase

| Feature | Status | Key files |
|---|---|---|
| Mixer with numeric values and clear labels | ✅ | `apps/web/components/daw/Mixer.tsx` |
| Track colors and icons in Mixer + Timeline | ✅ | `apps/web/lib/track-styles.ts`, `Mixer.tsx`, `Timeline.tsx` |
| Collapsible Mixer + simplified main layout | ✅ | `apps/web/app/page.tsx` |
| Audio context fallback "Enable Audio" button | ✅ | `apps/web/app/page.tsx`, `apps/web/lib/audio-engine.ts` |
| Onboarding hints panel | ✅ | `apps/web/app/page.tsx` |
| CI + tests green | ✅ | `npm run ci`, `pytest` |
| Production deployment | ✅ | Vercel |

## Validation

- `npm run ci` passes (lint, type-check, 18 vitest tests).
- `pytest` passes in `apps/api` (6 tests).
- Production deployment: https://vercel-aiwf5l70f-pawes-projects-6903ff8e.vercel.app

## What improved the most

1. **Mixer is no longer a wall of anonymous sliders** — every channel now has a color, icon, dB readout and pan label (L/C/R). Users can immediately see what each slider controls.
2. **Timeline matches the Mixer** — tracks have the same colors and icons, so regions are visually tied to their channels.
3. **Screen is cleaner by default** — Mixer is hidden until the user clicks "Show Mixer". The core workflow (prompt → generate → timeline) is now front and center.
4. **Audio starts reliably** — if the browser blocks auto-start, a prominent "Enable Audio" button appears. Play also attempts to resume audio automatically.
5. **First-run confusion reduced** — the hints panel explains the three-step workflow and can be dismissed.

## Honest critique / highest ROI next steps

### 1. Still no live parameter tweaking
Users can move volume/pan but cannot change synth cutoff, envelope, reverb or other timbre parameters. **ROI: very high.** Add per-track macro controls (cutoff, resonance, attack, decay, reverb send) directly in the Mixer or a selected-track inspector.

### 2. Presets generate music that is still somewhat generic
Style-aware presets helped, but the result still feels like a loop rather than a track with builds, drops and arrangement evolution. **ROI: very high.** Add phrase-level arrangement: filter sweeps, drum fills, mute/unmute sections, and melodic variation across bars.

### 3. No visual waveform or meter feedback
The UI is silent visually — no level meters, no waveform thumbnails, no spectrum. **ROI: high.** Add a simple master level meter and mini velocity/activity indicators on track headers.

### 4. Piano Roll is still basic
No quantization, no note resizing from edges, no multi-select, no copy/paste. **ROI: high.** Add edge resize, quantization grid toggle and multi-select.

### 5. Onboarding is a static box
It helps once, but disappears. **ROI: medium.** Add contextual tooltips on first hover of each control and a persistent "?" help toggle.

### 6. Mobile / narrow screens are untested
The grid layout and Timeline assume desktop width. **ROI: medium.** Add responsive breakpoints and horizontal scrolling hints.

## Recommended priority order

1. **Per-track synth macros** — biggest audible creative gain.
2. **Arrangement evolution / automation** — turns loops into tracks.
3. **Better Piano Roll editing** — keeps users inside the app.
4. **Visual meters / activity feedback** — makes the DAW feel alive.
5. **Contextual help / tooltips** — reduces support friction.

## Deployment

- Vercel production: https://vercel-aiwf5l70f-pawes-projects-6903ff8e.vercel.app
- GitHub: `postro75/GRAVSYSTEM`
