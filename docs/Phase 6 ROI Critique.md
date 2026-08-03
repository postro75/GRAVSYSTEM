# Phase 6 ROI Critique — GRAVSYSTEM

## Delivered in this phase

| Feature | Status | Key files |
|---|---|---|
| Custom synth voices for bass/lead/pad/arpeggio/chords/stab | ✅ | `apps/web/lib/audio-engine.ts` |
| SoundFont kept as fallback for FX/drone | ✅ | `apps/web/lib/audio-engine.ts` |
| Offline WAV export | ✅ | `apps/web/lib/audio-export.ts` |
| Velocity editing in Piano Roll | ✅ | `apps/web/components/daw/PianoRoll.tsx` |
| Region duplicate / delete in Timeline | ✅ | `apps/web/components/daw/Timeline.tsx`, `apps/web/app/page.tsx` |
| Metronome toggle | ✅ | `apps/web/components/daw/Transport.tsx`, `apps/web/lib/audio-engine.ts` |
| Test coverage for WAV export | ✅ | `apps/web/__tests__/audio-export.test.ts` |
| Production deployment | ✅ | Vercel |

## Validation

- `npm run ci` passes (lint + type-check + vitest).
- `pytest` passes in `apps/api`.
- Production deployment: https://vercel-6xxn204xm-pawes-projects-6903ff8e.vercel.app

## What improved the most

1. **Sound quality** — replacing GM SoundFont with `MonoSynth`, `DuoSynth`, `PolySynth` and `FMSynth` gives recognizable electronic character (Jarre/Kavinsky-style bass, pads, arpeggios). Tracks no longer sound like a random GM demo.
2. **Creator workflow** — velocity editing, duplicate/delete regions and metronome make the DAW usable for real iteration.
3. **Export options** — WAV export lets users take the generated idea out of the browser.

## Honest critique / highest ROI next steps

### 1. Drum sampler is still using placeholder WAV files
`AudioEngine` loads `/samples/kick.wav`, `snare.wav`, `hihat.wav`, `clap.wav`. If the files are missing or poor quality, the beat sounds like a laser. **ROI: very high.** Replace with synthesized drums (MembraneSynth/NoiseSynth) or ship a small, high-quality sample pack.

### 2. Offline WAV export does not use SoundFont
`renderProjectToWav` uses pure Tone.js synths for every track. FX/drone tracks lose their SoundFont character when exported. **ROI: medium-high.** Route SoundFont tracks through an offline-compatible path or render the live AudioContext to a real WAV in the browser (MediaRecorder/Recorder.js) as a higher-fidelity alternative.

### 3. Preset generator still ignores the artist description
The generator parses keywords (`jarre`, `synthwave`, etc.) but does not map them to synth parameters, chord progressions or arrangement rules. **ROI: very high.** Add style-specific presets in `generator.ts` that set:
- synth voice parameters,
- chord progressions,
- drum patterns,
- FX sends.

### 4. No automation / modulation
There is no LFO, filter automation or mixer automation. Electronic music lives on movement. **ROI: high.** Add per-track LFO and filter envelope modulation.

### 5. Visual polish gap
The UI is clean but generic. Apple-style dashboards benefit from track color coding, waveform/MIDI thumbnails in regions, and consistent iconography. **ROI: medium.** Add track colors and a compact spectrum/waveform preview.

### 6. No audio preview while editing
Piano Roll edits require closing and pressing Play to hear the result. **ROI: high.** Add a "preview note on click" mode using a lightweight synth.

## Recommended priority order

1. **Drum kit overhaul** — highest audible impact per hour.
2. **Style-aware generator presets** — makes the prompt-to-music promise real.
3. **Piano Roll note preview** — closes the editing feedback loop.
4. **Automation / modulation** — differentiates GRAVSYSTEM from simple loop generators.
5. **Real-time WAV capture fallback** — better export fidelity with SoundFont tracks.

## Deployment

- Vercel production: https://vercel-6xxn204xm-pawes-projects-6903ff8e.vercel.app
- GitHub: `postro75/GRAVSYSTEM`
