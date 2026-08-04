# Phase 10 ROI Critique — GRAVSYSTEM

## Delivered in this phase

| Feature | Status | Key files |
|---|---|---|
| Instrument library with custom synths, GM SoundFonts and drum kits | ✅ | `apps/web/lib/instruments.ts`, `apps/web/lib/drum-kit.ts` |
| Per-track instrument picker in Inspector | ✅ | `apps/web/components/daw/InstrumentPicker.tsx`, `Inspector.tsx` |
| Live instrument preview on hover / click | ✅ | `apps/web/lib/audio-engine.ts`, `InstrumentPicker.tsx` |
| Chord Pad — diatonic chord insertion + preview | ✅ | `apps/web/components/daw/ChordPad.tsx`, `BottomPanel.tsx` |
| Step Sequencer — 16-step drum grid | ✅ | `apps/web/components/daw/StepSequencer.tsx` |
| Virtual Piano — mouse + computer keyboard (A–L) + record | ✅ | `apps/web/components/daw/VirtualPiano.tsx` |
| Bottom panel tabs: Piano Roll / Chords / Steps / Keys / Mixer | ✅ | `apps/web/components/daw/BottomPanel.tsx` |
| Track schema extended with `instrument` + `instrumentType` | ✅ | `packages/core/src/index.ts` |
| CI + tests green | ✅ | `npm run ci`, `pytest` |
| Production deployment | ✅ | Vercel |

## Validation

- `npm run ci` passes (lint, type-check, 22 vitest tests).
- `pytest` passes in `apps/api` (6 tests).
- Production deployment: https://gravsystem.vercel.app

## What improved the most

1. **Users can now shape sound per track** — the Inspector shows a categorized instrument grid (bass, lead, pad, arp, chords, keys, strings, drums, FX). Selecting an instrument swaps the synth/SoundFont/drum kit for that track, and hovering previews the sound.
2. **Manual composition is finally possible** — Chord Pad inserts diatonic triads/sevenths into the selected region, Step Sequencer edits drum patterns as a 16-step grid, and Virtual Piano lets you play and record notes with the mouse or keyboard.
3. **The bottom panel has a clear purpose** — five tabs (Piano Roll, Chords, Steps, Keys, Mixer) keep editing tools in one predictable place instead of scattered controls.
4. **Track generator now assigns sensible instruments** — `inferInstrumentForTrack` maps generated track names to Jarre/synthwave/dance instruments so generated projects start with coherent sounds.
5. **Drums gained a sample kit** — `SampleDrumKit` loads public WAV samples, giving an alternative to the pure-synth kit.

## Honest critique / highest ROI next steps

### 1. Instrument picker swaps presets, but does not expose synth macros
Users cannot tweak cutoff, resonance, attack, decay, reverb, or chorus for a given instrument. A preset switch is a good start, but real sound design needs per-instrument macro controls. **ROI: very high.** Add a small "Edit Instrument" panel with ADSR, filter cutoff, and FX send knobs.

### 2. Step Sequencer is too simple
Only 16 steps, 4 drum rows, no velocity, no probability, no per-step accents. **ROI: high.** Extend to 32/64 steps, add velocity lanes, and support hi-hat/open-hat/shaker rows. Add probability/chance for generative variation.

### 3. Chord Pad is limited to diatonic triads/sevenths
No borrowed chords, no inversions, no custom voicings, no drag-to-timeline. **ROI: high.** Add inversion buttons, a "borrowed mode" selector, and allow dragging a chord directly onto the Piano Roll at the playhead.

### 4. Virtual Piano lacks expressiveness and MIDI input
No velocity sensitivity from mouse/keyboard, no sustain pedal, and no real MIDI keyboard support. **ROI: high.** Implement Web MIDI so a physical keyboard controls the piano and records velocity.

### 5. No sample browser or drag-and-drop
Users cannot import their own samples, loops, or one-shots. **ROI: medium-high.** Add an audio file drop zone and a project sample pool that can be assigned to tracks or drum pads.

### 6. Still no real-time visual feedback
No per-track level meters, no playhead bar/beat display beyond a static time counter, no clip activity LEDs. **ROI: medium-high.** Add a master meter, per-track activity indicators, and a bars/beats counter that advances during playback.

### 7. Preset artwork remains generic / unrelated
Preset and style cards still use stock images that do not strongly evoke Jarre, Kavinsky, or Guetta. **ROI: medium.** Generate or curate dedicated hero images and unify iconography per style/instrument category.

### 8. Mobile / narrow-screen layout is unsupported
The three-pane DAW layout only works on desktop. **ROI: medium.** Collapse the inspector and bottom panel into drawers on small screens.

## Recommended priority order

1. **Per-instrument macro editor (ADSR, filter, FX)** — biggest audible creative gain.
2. **Web MIDI + velocity-sensitive Virtual Piano** — closes the gap with real instruments.
3. **Richer Step Sequencer (velocity, probability, longer patterns)** — makes drum programming usable.
4. **Better Chord Pad (inversions, borrowed chords, drag-to-timeline)** — speeds up harmonic writing.
5. **Visual meters, activity LEDs, bars/beats counter** — makes the DAW feel alive.
6. **Sample import / browser** — unlocks user sound design.
7. **Dedicated preset artwork + iconography** — improves perceived polish.

## Deployment

- Vercel production: https://gravsystem.vercel.app
- GitHub: `postro75/GRAVSYSTEM`
