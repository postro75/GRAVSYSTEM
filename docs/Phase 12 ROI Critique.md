# Phase 12 ROI Critique — GRAVSYSTEM

## Delivered in this phase

| Feature | Status | Key files |
|---|---|---|
| Core track automation data model (param/time/value breakpoints) | ✅ | `packages/core/src/index.ts` |
| Automation scheduling in AudioEngine (volume, pan, cutoff, resonance, reverb, delay) | ✅ | `apps/web/lib/audio-engine.ts` |
| Automation editor bottom tab with stacked lanes | ✅ | `apps/web/components/daw/AutomationEditor.tsx` |
| Click/drag/right-click breakpoint editing with 0.25-beat snap | ✅ | `AutomationEditor.tsx` |
| Category-aware macro editor labels (bass/lead/pad/arp/drums/chords) | ✅ | `apps/web/components/daw/InstrumentMacroEditor.tsx` |
| Bottom panel Automation tab wired to selected track | ✅ | `apps/web/components/daw/BottomPanel.tsx` |
| State persistence and live re-scheduling from `page.tsx` | ✅ | `apps/web/app/page.tsx` |
| CI + tests green | ✅ | `npm run ci`, `pytest` |
| Production deployment | ✅ | Vercel |

## Validation

- `npm run ci` passes (lint, type-check, 29 vitest tests).
- `pytest` passes in `apps/api` (6 tests).
- Production deployment: https://gravsystem.vercel.app

## What improved the most

1. **Static mixes become evolving tracks** — users can draw volume rides, filter sweeps, pan moves, and FX-send automation across the timeline. This is the single biggest step from "loop" to "arrangement".
2. **Automation is sample-accurate** — ramps are scheduled on the audio thread via `Tone.Transport`, so parameter changes align with playback.
3. **Macro editor now speaks the language of the instrument** — cutoff becomes "Growl" on bass, "Brightness" on lead, "Darkness" on pads, etc. The same underlying params feel category-specific.
4. **Editing is fast** — one click adds a breakpoint, drag moves it, right-click deletes; lanes can be filtered to a single parameter.
5. **Everything persists** — automation points live on the track and are saved to IndexedDB like regions and notes.

## Honest critique / highest ROI next steps

### 1. No per-track insert effects rack
Automation only controls existing channel params. Users cannot add distortion, chorus, EQ, or compressor per track. **ROI: very high.** Add an insert rack with on/off and a few key modules; this unlocks real sound design beyond macros.

### 2. Automation cannot be copied/pasted or quantized
Breakpoints are edited one by one. **ROI: high.** Add multi-select, copy/paste between tracks/params, and snap values to grid/percentages.

### 3. No automation for instrument macro params
ADSR, oscillator type, and category-specific macros are not automatable yet. **ROI: high.** Extend the automation lane list to include macro params (attack, decay, cutoff, etc.) so filter envelopes can be drawn directly.

### 4. Macro editor is only label-aware, not parameter-aware
Category profiles rename sliders but do not add new synth controls (e.g., unison for pads, portamento for leads). **ROI: medium-high.** Introduce category-specific extra params mapped to new per-track insert nodes or synth properties.

### 5. Web MIDI recording still lacks quantize and overdub
Recorded notes from a MIDI keyboard land exactly at the playhead with no snapping. **ROI: medium-high.** Add record quantize (1/16, 1/8) and an overdub mode that keeps existing notes.

### 6. Visual feedback on automation during playback is missing
There is no playhead line or current-value indicator in the automation editor. **ROI: medium.** Draw the playhead position and optionally a moving dot per lane showing the live automated value.

### 7. No easy way to reset or solo a single automation lane
Users must delete points manually. **ROI: medium.** Add per-lane "Clear" and "Reset to default" buttons.

## Recommended priority order

1. **Per-track insert effects rack** — biggest audible creative gain.
2. **Macro params as automation targets** — makes the macro editor and automation work together.
3. **Copy/paste/quantize for automation** — turns breakpoint editing into a real workflow.
4. **Quantize + overdub for MIDI recording** — makes live recording usable.
5. **Playhead/current-value overlay in Automation editor** — improves usability.

## Deployment

- Vercel production: https://gravsystem.vercel.app
- GitHub: `postro75/GRAVSYSTEM`
