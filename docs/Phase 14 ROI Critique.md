# Phase 14 ROI Critique — Style-aware generation & Automation playhead

## Summary

Phase 14 addresses the biggest complaint from Phase 13: generated projects often sound generic and unrelated to the requested artist/style. It also adds the missing visual feedback in the Automation editor.

Delivered:

1. **Style-aware instrument palette** — each style (jarre, ambient, synthwave, dance, electro, house, techno) now maps track categories to preferred synths and soundfonts.
2. **Style-specific default macro parameters** — ADSR, filter cutoff, reverb and delay are now seeded per style, so Jarre/ambient sounds are slow and spacious while techno/electro sounds are tight and bright.
3. **Density control** — descriptions like "spokojny ambient space" or "busy dense dance" are parsed into `sparse | medium | dense` and influence note density across drums, bass, arpeggios, chords and leads.
4. **Richer chord progressions and arrangements** — each style now has multiple progression variants selected deterministically from the seed; ambient/Jarre arrangements use longer intros/outros without hard drops.
5. **Automation editor playhead** — a vertical line follows playback position and the view auto-scrolls to keep it visible.

## What changed

- `apps/web/lib/instruments.ts`
  - Added `STYLE_INSTRUMENT_PALETTE` and deterministic palette lookup in `inferInstrumentForTrack`.
- `apps/web/lib/instrument-params.ts`
  - Added `STYLE_INSTRUMENT_PARAMS` and `defaultParamsForStyle(style)`.
- `apps/web/lib/music-theory.ts`
  - Added `Density` type and `detectDensity(description)`.
  - Added `density` to `GenerationConfig`.
  - Expanded `STYLE_PROGRESSIONS` to multiple variants per style/scale.
  - Reworked ambient/Jarre arrangements to be more intro/build/break/outro oriented.
  - Fixed `defaultProgression` to emit valid `Asus4` instead of invalid `Amsus4`.
- `apps/web/lib/pattern-generator.ts`
  - Added `density` to `GenerationContext`.
  - Applied density to hats, snare fills, bass subdivisions, arpeggio step counts, lead note probability and chord stabs.
- `apps/web/lib/generator.ts`
  - Uses `defaultParamsForStyle(config.style)` per track.
- `apps/web/components/daw/AutomationEditor.tsx`
  - Accepts `position` and `bpm`, renders a synced playhead line and auto-scrolls.
- `apps/web/components/daw/BottomPanel.tsx` and `apps/web/app/page.tsx`
  - Pass current playback position to the Automation editor.
- Tests
  - Updated `instruments.test.ts` to assert palette membership.
  - Added style params test in `instrument-params.test.ts`.
  - Added `detectDensity` and density-config tests in `music.test.ts`.
  - Added style instrument/macro and density-count tests in `generator.test.ts`.
  - Added playhead render test in `automation.test.tsx`.

## Validation

- `npm run ci` passes: lint, type-check, 44 vitest tests green.
- `pytest` in `apps/api` passes (6 tests).
- Production deployment succeeded: `https://gravsystem.vercel.app` is live.

## ROI / quality critique

### Wins

- **The generator is now style-literate** — a "Jarre ambient" prompt picks Jarre bass/lead, choir/string pads, FM arps, sample drums and long envelopes, moving the result much closer to the user's reference artists.
- **Density actually changes the audio** — sparse arrangements are noticeably thinner, dense ones busier, with real variation in hi-hat and fill density.
- **Playhead makes automation usable** — users can now see where filter sweeps and macro changes happen relative to the playhead.
- **Deterministic palette selection** — the same prompt yields the same instruments, which is important for reproducibility.

### Gaps and next highest-ROI fixes

1. **No explicit instrument override from natural language**
   - A prompt like "piano lead" still gets a synth lead because the style palette wins. Adding per-instrument keyword extraction would be a big usability win.
2. **Chord progressions are still static loops**
   - Every bar cycles the same 4-chord progression. Adding section-specific progressions (e.g., different chord for build vs drop) would make arrangements more musical.
3. **Playhead is read-only**
   - Users can't click on the timeline/automation lane to seek. This is acceptable for now but will become a friction point.
4. **Density is coarse (3 levels)**
   - Good enough for current scope, but a continuous density slider or per-track density would offer finer control.
5. **No live value indicator on automation lanes**
   - The line shows position, but not the current automated value. A small tooltip/dot would improve editing.
6. **Melody/harmony still rule-based**
   - The lead patterns are random walks over chords/scales. Eventually a small music-language model or Markov-based phrase generator would produce more memorable hooks.

## Recommendation

Ship Phase 14, then prioritize **(a) per-instrument keyword extraction from the prompt** and **(b) section-specific chord progressions / variation**. These two items deliver the most audible improvement toward sounding like a real artist track.
