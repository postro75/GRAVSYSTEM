# Phase 7 ROI Critique — GRAVSYSTEM

## Delivered in this phase

| Feature | Status | Key files |
|---|---|---|
| Synthesized drum kit (no WAV dependencies) | ✅ | `apps/web/lib/drum-kit.ts`, `apps/web/lib/audio-engine.ts`, `apps/web/lib/audio-export.ts` |
| Style-aware synth voices (Jarre / synthwave / dance) | ✅ | `apps/web/lib/audio-engine.ts` |
| Style-aware drum, bass, lead patterns | ✅ | `apps/web/lib/pattern-generator.ts`, `apps/web/lib/music-theory.ts` |
| Piano Roll note preview | ✅ | `apps/web/components/daw/PianoRoll.tsx` |
| CI + tests green | ✅ | `npm run ci`, `pytest` |
| Production deployment | ✅ | Vercel |

## Validation

- `npm run ci` passes (lint, type-check, vitest: 18 tests).
- `pytest` passes in `apps/api` (6 tests).
- Production deployment: https://vercel-g23xptfpg-pawes-projects-6903ff8e.vercel.app

## What improved the most

1. **Drums no longer sound like lasers** — synthesized kick/snare/hihat/clap are consistent, dependency-free, and render identically offline.
2. **Style actually matters now** — Jarre prompts get slower arpeggios, long pads, sparse Oxygène-style drums and sustained bass. Synthwave gets gated snare, driving bass and wide lead lines. Dance/EDM gets four-on-floor, clap on 2/4 and 16th hats.
3. **Piano Roll is playable** — adding or selecting a note gives immediate audio feedback.

## Honest critique / highest ROI next steps

### 1. Preset images and iconography are still generic
Presets generate unrelated imagery and the UI lacks Apple-style track colors / icons. **ROI: high for perceived quality.** Add track color palette, per-style hero images, and consistent icon set.

### 2. Generator still ignores descriptive nuance beyond keywords
"A bit more Jean-Michel Jarre, a bit less techno" is not parsed. **ROI: very high.** Add a style-weight slider or multi-style blend (e.g. 70% jarre + 30% ambient) and descriptive intensity words ("darker", "faster", "sparser").

### 3. No real-time parameter tweaking
Users cannot tweak filter cutoff, envelope or effects while the track plays. **ROI: very high.** Expose per-track synth macros (cutoff, resonance, attack/decay, reverb send) in the Mixer.

### 4. Mix is still static
Every track uses the same master chain. **ROI: medium-high.** Add per-track inserts (filter, chorus, distortion) and a sidechain depth control.

### 5. No audio upload / recording
GRAVSYSTEM is MIDI-only. **ROI: medium.** Allow microphone or file upload for vocal/field-recording layers.

### 6. Offline WAV export drops SoundFont character
FX/drone tracks still lose their SoundFont voice in exported WAV. **ROI: medium.** Add a live-capture export path using the running AudioContext or load SoundFont in Tone.Offline.

## Recommended priority order

1. **Per-track synth macros in Mixer** — biggest creative payoff.
2. **Style blend / intensity parsing** — closes the "describe what you want" gap.
3. **Visual identity overhaul** — colors, icons, preset photography.
4. **Per-track FX and automation** — moves from toy toward real DAW.
5. **Real-time WAV capture** — better fidelity for sharing.

## Deployment

- Vercel production: https://vercel-g23xptfpg-pawes-projects-6903ff8e.vercel.app
- GitHub: `postro75/GRAVSYSTEM`
