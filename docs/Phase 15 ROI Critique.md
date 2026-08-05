# Phase 15 ROI Critique — Professional Sound & UX Overhaul

## Summary

Phase 15 attacks the two loudest complaints from previous phases: the generated music sounds cheap/generic and the interface is hard to understand. It overhauls the drum and synth engines, makes patterns more style-specific and less repetitive, and cleans up the instrument picker and step sequencer.

Delivered:

1. **Drum sound overhaul** — the synthetic kit now uses a weighted kick (sub + click), mixed body/noise snare, band-passed white-noise hats (no more "laser" hihat), multi-burst clap, and a long pink-noise crash. Sample kit remains as fallback with velocity-sensitive playback.
2. **Synth sound overhaul** — new style-specific instruments (`jarre-bass-seq`, `jarre-pad`, `jarre-brass`, `kavinsky-bass`, `kavinsky-lead`, `kavinsky-arp`, `guetta-lead`, `guetta-chords`) plus fat/detuned oscillators and longer envelopes for pads and Jarre leads.
3. **Style-aware master FX chain** — reverb/delay/compressor settings now follow the project style: long/spacious for Jarre/ambient, tight/compressed for dance/EDM.
4. **Richer chord progressions** — Jarre/ambient progressions now use `add9`, `maj7`, `sus4` and slash chords; transposition now preserves slash chords and `m7` suffixes correctly.
5. **Less repetitive patterns** — bass lines and arpeggios change direction/phrase every few bars; Jarre bass alternates sustained and moving variants.
6. **UI clarity** — instrument picker has category icons, style filters, descriptions and hover previews; macro sliders show tooltips; step sequencer adds beat numbers and clearer active states; onboarding hint is condensed.
7. **WAM host stub** — `lib/wam-host.ts` lists known browser plugins (Dexed, OB-Xd, Vital) and checks AudioWorklet support, ready for Phase 16 integration.

## What changed

- `apps/web/lib/drum-kit.ts`
  - Rewrote `SynthDrumKit` with kick body+click, snare body+wires, band-passed hats, multi-burst clap, pink crash.
  - Kept `SampleDrumKit` with velocity-sensitive triggering.
- `apps/web/lib/instruments.ts`
  - Added 10+ new style-specific instruments.
  - Switched pads/leads to `fatsawtooth` oscillators for unison width.
  - Updated `STYLE_INSTRUMENT_PALETTE` to prefer new instruments per style.
  - Added `description` field to instrument definitions.
- `apps/web/lib/instrument-params.ts`
  - No schema changes; macro mappings still apply.
- `apps/web/lib/audio-engine.ts`
  - Added `configureMasterChain(style)` to set reverb/decay/compression per style.
- `apps/web/lib/music-theory.ts`
  - Expanded `STYLE_PROGRESSIONS` with colour chords (`m7`, `maj7`, `add9`, `sus4`, slash chords).
  - Improved `detectStyle` with more artist/keyword aliases.
  - Fixed `transposeProgression` to preserve `m7` and slash chords.
  - Fixed `CHORD_PATTERN` to match `m7` and `m7b5` correctly.
- `apps/web/lib/pattern-generator.ts`
  - Lowered hihat velocities across all patterns.
  - Added phrase variation to Jarre bass and arpeggio direction.
  - Reduced "laser" hihat velocities in Jarre/ambient patterns.
- `apps/web/lib/presets.ts`
  - Replaced generic Wikimedia images with style-matched Unsplash photos.
  - Rewrote descriptions to mention the actual artist reference and instrumentation.
- `apps/web/components/daw/InstrumentPicker.tsx`
  - Added category icons, style filter chips, descriptions, hover preview.
- `apps/web/components/daw/InstrumentMacroEditor.tsx`
  - Added tooltip descriptions for every macro slider.
- `apps/web/components/daw/StepSequencer.tsx`
  - Added beat numbers (1-2-3-4) and stronger active-step highlight.
- `apps/web/app/page.tsx`
  - Condensed onboarding hints into a single scannable line.
- `apps/web/lib/wam-host.ts` + `__tests__/wam-host.test.ts`
  - Research scaffold and smoke test for browser WAM integration.

## Validation

- `npm run ci` passes: lint, type-check, 46 vitest tests green.
- `pytest` in `apps/api` passes (6 tests).
- Production deployment succeeded: `https://gravsystem.vercel.app` is live.

## ROI / quality critique

### Wins

- **Drums no longer sound like lasers** — band-passed noise hats and a layered snare are immediately more musical.
- **Style presets are now recognisable** — Jarre gets slow analog bass + space pads, Kavinsky gets detuned saw bass + anthem lead, Guetta gets tight EDM drums + big-room chords.
- **Chord progressions are richer** — sus4/add9/maj7 colours and slash-bass movement make progressions less blocky.
- **UI explains itself** — category icons, style filters, and macro tooltips remove the "wall of sliders" problem.
- **Codebase is ready for WAM** — the host stub gives a clear integration point without destabilising the current engine.

### Gaps and next highest-ROI fixes

1. **No real WAM plugin loaded yet**
   - The stub lists plugins but does not instantiate them. Adding one working WAM instrument (e.g. Dexed web build) would leapfrog the browser sound quality.
2. **Melodies are still rule-based loops**
   - Leads and arps vary per bar but lack memorable phrases. A small pattern-memory or Markov generator would help hooks stick.
3. **No side-chain ducking from kick**
   - Dance/synthwave styles need the kick to duck pads/bass for the pumping club feel. The engine already has sidechain gain nodes; wiring the kick to them is a small, high-impact change.
4. **Mastering is static per style, not per track**
   - A per-track EQ and style-aware default insert FX would let users fine-tune without drowning in sliders.
5. **No audio-rate modulation (LFOs) exposed to the user**
   - Instruments use fixed LFO settings. Exposing LFO rate/depth macros would open up more Jarre-style movement.
6. **SoundFont quality is still General MIDI**
   - `smplr` loads FluidR3_GM. Better sample libraries or SFZ support would improve realism for keys/strings.

## Recommendation

Ship Phase 15, then prioritize **(a) side-chain kick ducking** and **(b) the first real WAM plugin integration** (Dexed or OB-Xd). These two changes deliver the biggest jump in "produced" sound quality while keeping the app fully browser-based.
