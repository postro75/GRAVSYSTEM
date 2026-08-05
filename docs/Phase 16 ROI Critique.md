# Phase 16 ROI Critique — Side-Chain Ducking, Real WAM Plugin, Backend Render Prototype

## Summary

Phase 16 delivers three long-planned capabilities: kick-driven side-chain ducking, the first real Web Audio Modules (WAM) instrument integration, and a documented offline-render prototype using DawDreamer.

Delivered:

1. **Side-chain kick ducking** — every kick hit ducks selected tracks (bass, pads, chords) with a style-aware curve. Techno gets a deep/fast pump, house a smoother groove, ambient/Jarre a subtle breathed dip.
2. **Real WAM instrument** — Synth-101 (Burns Audio WAM, Roland SH-101 clone) loads behind the `NEXT_PUBLIC_ENABLE_WAM=true` feature flag and is playable from the normal track channel chain.
3. **Backend render prototype** — `apps/api/render_dawdreamer.py` can render a GRAVSYSTEM project to WAV via DawDreamer when available, and falls back to Standard MIDI File export when it is not.
4. **Quality gate** — fixed a flaky music-theory test that depended on `Date.now()`/`Math.random()` seeding.

## What changed

- `packages/core/src/index.ts`
  - Added `sidechain: boolean` to `TrackSchema`.
  - Extended `instrumentType` enum with `'wam'`.
- `apps/web/lib/audio-engine.ts`
  - Added `sidechainCurve(style)` returning per-style attack/release/floor values.
  - `createTrackChannel` now builds a `sidechain` gain node on every melodic track.
  - Kick hits schedule ducking ramps on all tracks marked `sidechain=true`.
  - Added `updateSidechain(trackId, boolean)` live toggle.
  - Added WAM branch in `loadInstrumentForTrack` and `scheduleProject`.
- `apps/web/lib/instruments.ts`
  - Added `'wam'` to `InstrumentType`.
  - Registered `wam-synth101` behind `NEXT_PUBLIC_ENABLE_WAM=true`.
- `apps/web/lib/wam-host.ts`
  - Replaced research stub with `initWamHost`, `loadSynth101`, and a `WamInstrument` wrapper.
  - Lazy-loads `@webaudiomodules/sdk` so Node/jsdom tests can import the module safely.
- `apps/web/types/wam.d.ts`
  - Declaration for the Synth-101 WAM bundle (ships without TypeScript types).
- `apps/web/__tests__/wam-host.test.ts`
  - Smoke tests for plugin listing and AudioWorklet support detection.
- `apps/web/__tests__/audio-engine.test.ts`
  - Added coverage for style-aware sidechain curves.
- `apps/web/components/daw/Inspector.tsx` + `apps/web/app/page.tsx`
  - Added side-chain toggle in the track inspector.
- `apps/api/render_dawdreamer.py`
  - Converts a GRAVSYSTEM `Project` to MIDI, optionally renders through DawDreamer to WAV.
  - Graceful fallback to MIDI export with diagnostic message when DawDreamer is unavailable.
- `apps/api/tests/test_render_dawdreamer.py`
  - Verifies the MIDI fallback path.
- `apps/web/__tests__/music.test.ts`
  - Made the "builds config with overrides" test deterministic by pinning the seed.

## Validation

- `npm run ci` passes: lint, type-check, 50 vitest tests green.
- `npm run test --workspace=apps/api` passes: 7 pytest tests green.
- Production deployment succeeded: `https://gravsystem.vercel.app` is live.

## ROI / quality critique

### Wins

- **Side-chain ducking immediately improves club styles** — bass and pads now breathe with the kick, giving techno/house/synthwave the right energy.
- **WAM integration is real, not a stub** — Synth-101 is a genuine third-party instrument plugin loaded at runtime; it proves the browser can host professional instruments beyond Tone.js.
- **Lazy-loading keeps tests fast** — WAM SDK is only imported when a WAM track is loaded, so the existing test suite stays green in jsdom.
- **Backend render path is documented and testable** — even without DawDreamer installed, the module exports MIDI and explains what to do next.

### Gaps and next highest-ROI fixes

1. **Only one WAM plugin is wired**
   - Synth-101 is monophonic and SH-101 flavoured. Adding a polyphonic WAM (Dexed, OB-Xd web, Vital) would cover pads and chords properly.
2. **WAM instruments are not exposed in the preset generator**
   - Presets still choose Tone.js instruments. A WAM-aware generator could pick Synth-101 for leads automatically when the flag is on.
3. **No GUI for the WAM plugin**
   - The plugin loads headlessly. Opening its native UI in a modal would let users tweak the sound.
4. **DawDreamer is optional and hard to install**
   - The render prototype relies on a binary Python package. A containerised render service or a Carla-based Linux path would make it reproducible.
5. **Side-chain is global per track, not per-section**
   - Some sections might want less ducking. Per-section side-chain amount would add musical dynamics.
6. **No user-facing render button yet**
   - `render_dawdreamer.py` is CLI-only. A frontend export option ("Render WAV") calling the backend endpoint is the obvious next UI step.

## Recommendation

Ship Phase 16, then prioritize **(a) a second polyphonic WAM plugin** for chords/pads, **(b) exposing WAM plugin GUIs**, and **(c) wiring the render prototype to a `/api/render` endpoint** so users can download audio without leaving the browser.
