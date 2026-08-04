# Phase 13 ROI Critique — Insert Effects Rack, Macro Automation & MIDI Recording

## Summary

Phase 13 shipped three user-facing capabilities that close the gap between a simple generator preview and a real DAW-like editing experience:

1. **Per-track insert effects rack** — distortion, chorus, EQ and compressor are now part of every track's signal chain and editable from the Inspector.
2. **Macro automation lanes** — ADSR envelope parameters (`attack`, `decay`, `sustain`, `release`) plus existing channel parameters are now valid automation targets in the Automation editor.
3. **Quantized, overdub-aware MIDI recording** — the Virtual Piano can quantize recorded notes to 1/4, 1/8 or 1/16 and either replace or overdub the current region.

## What was delivered

- `packages/core/src/index.ts`
  - `InsertEffectsSchema` and `DEFAULT_INSERT_EFFECTS` added to the track schema.
  - `AUTOMATION_PARAMS` extended with `attack | decay | sustain | release` and concrete `AUTOMATION_RANGES`.
- `apps/web/lib/audio-engine.ts`
  - Track signal chain now routes through `filter -> distortion -> chorus -> eq -> compressor -> sidechain -> master`.
  - `applyInsertEffects()` maps normalized 0–1 amounts to concrete Tone.js parameters.
  - `updateInsertEffects()` mutates the project track and updates the live processor.
  - `scheduleAutomation()` schedules macro ADSR changes as Transport callbacks that update the instrument in real time.
- `apps/web/components/daw/InsertEffectsRack.tsx`
  - New Inspector panel with four sliders for distortion, chorus, EQ and compressor.
- `apps/web/components/daw/AutomationEditor.tsx`
  - Added labels for the new macro lanes.
- `apps/web/components/daw/VirtualPiano.tsx`
  - Added quantize grid selector and Replace/Overdub toggle.
  - First recorded note in Replace mode clears existing region notes; subsequent notes append.
- `apps/web/lib/midi-utils.ts`
  - Shared `QuantizeGrid`, `gridToBeats()` and `quantizeValue()` helpers.
- `apps/web/app/page.tsx`
  - Wired `handleInsertEffectsChange` and extended `handleRecordNote` to honor the `replace` flag.
- `apps/web/lib/generator.ts`
  - Generated tracks now seed `insertEffects: DEFAULT_INSERT_EFFECTS`.
- Tests
  - `apps/web/__tests__/insert-effects.test.ts` (4 tests)
  - `apps/web/__tests__/midi-utils.test.ts` (5 tests)

## Validation

- `npm run ci` passes: lint, type-check and 38 vitest tests are green.
- `pytest` in `apps/api` passes (6 tests).
- Production deployment succeeded: `https://gravsystem.vercel.app` is live and aliased.

## ROI / quality critique

### Wins

- **Signal chain is now credible** — every track has tone-shaping and dynamics inserts comparable to a basic DAW channel strip.
- **Automation is no longer limited to mixer sends** — ADSR ramps make generated pads and basses evolve over time, which is central to the Jarre/ambient sound the user wants.
- **Recording usability jumped** — quantize fixes the sloppy timing of live keyboard/MIDI input; replace/overdub gives predictable region editing behavior.
- **Low regression risk** — changes are additive, core schema is backward-compatible, and tests cover the new pure functions.

### Gaps and next highest-ROI fixes

1. **No insert bypass / presets**
   - Users can only set amount, not turn an effect off completely or recall a preset. A bypass toggle would cost ~10 lines and immediately improve mix control.
2. **EQ is a single "tilt" knob**
   - The current EQ maps one amount to low/mid/high symmetrically. A real DAW needs separate low/mid/high gain controls. ROI is medium; the current design is a good 80/20 compromise.
3. **Macro automation is steppy**
   - ADSR changes are applied instantly at each point. Linear ramping between macro points would sound smoother, but requires scheduling intermediate parameter updates.
4. **No visual feedback for automation playback**
   - The Automation editor is static. A playhead line and live value indicator would make editing much faster.
5. **Virtual Piano still has no velocity-sensitive touch or pitch bend**
   - Nice-to-have; not blocking for the current milestone.
6. **Generated music still drifts from requested artist styles**
   - Phase 13 fixed mixing/recording tools, not the generation model. The next high-value phase should improve prompt-to-MIDI intent matching (chord progressions, instrument selection, fill density).

## Recommendation

Merge this phase, then prioritize **(a) instrument/style-aware generation improvements** and **(b) a playhead + live meter in the Automation editor**. These two items deliver the most audible and visible progress toward a professional DAW experience.
