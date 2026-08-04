# Phase 11 ROI Critique — GRAVSYSTEM

## Delivered in this phase

| Feature | Status | Key files |
|---|---|---|
| Track schema extended with `instrumentParams` (ADSR, filter, FX sends) | ✅ | `packages/core/src/index.ts` |
| Instrument macro engine for Tone synths + track-level filter/sends | ✅ | `apps/web/lib/instrument-params.ts` |
| Per-track filter, reverb/delay sends, and RMS meters in AudioEngine | ✅ | `apps/web/lib/audio-engine.ts` |
| Inspector macro editor (8 sliders: envelope + tone/FX) | ✅ | `apps/web/components/daw/InstrumentMacroEditor.tsx`, `Inspector.tsx` |
| Web MIDI input in Virtual Piano with velocity and timing | ✅ | `apps/web/components/daw/VirtualPiano.tsx` |
| Real-time track level meters + activity LEDs in track headers | ✅ | `apps/web/components/daw/TrackHeaders.tsx`, `page.tsx` |
| Generator sets default `instrumentParams` on every track | ✅ | `apps/web/lib/generator.ts` |
| CI + tests green | ✅ | `npm run ci`, `pytest` |
| Production deployment | ✅ | Vercel |

## Validation

- `npm run ci` passes (lint, type-check, 26 vitest tests).
- `pytest` passes in `apps/api` (6 tests).
- Production deployment: https://gravsystem.vercel.app

## What improved the most

1. **Users can now shape the sound, not just the notes** — the Inspector shows ADSR, cutoff, resonance, reverb and delay sends. Changes apply to the live synth in real time and persist per track.
2. **Web MIDI bridges physical controllers** — a MIDI keyboard plugged into the browser controls the Virtual Piano with velocity and records note-on/off timing at the current playhead.
3. **The DAW finally gives visual feedback** — every track header has a small level meter and an activity LED that responds to playback.
4. **FX sends are per-track** — reverb and delay are no longer global on/off; each track has its own send level, opening up space and depth in mixes.
5. **Macros work across instrument types** — custom synths get envelope/filter updates directly; SoundFont and drum tracks get the same treatment through a per-track filter and sends.

## Honest critique / highest ROI next steps

### 1. Macro editor is still a generic grid
It shows the same eight sliders for every instrument. A bass should expose drive/saturation, a pad should expose chorus/unison, a lead should expose portamento/glide. **ROI: high.** Make the macro editor instrument-category-aware (bass/lead/pad/arp/drums) and show only relevant controls plus the universal ADSR.

### 2. No automation lanes
Parameter changes are static per track. Users cannot draw filter sweeps, volume rides, or send automations over time. **ROI: very high.** Add an automation lane view in the bottom panel and store automation points per parameter per track.

### 3. Meters are polled, not sample-accurate
The meters update once per `requestAnimationFrame`, which is fine visually but too coarse for professional mixing. **ROI: medium-high.** Use `Tone.Meter` with shorter smoothing and, eventually, a dedicated worker/animation loop for smoother metering.

### 4. Virtual Piano recording is playhead-relative only
Notes are recorded at the transport playhead, but there is no count-in, no quantization, and no overdub. **ROI: medium-high.** Add record-arm mode, count-in, quantize to grid, and punch-in/punch-out.

### 5. Web MIDI has no device selection or channel filtering
All MIDI inputs are merged and all channels are accepted. **ROI: medium.** Add a MIDI input selector and respect MIDI channels so a controller set to channel 1 only controls the selected track.

### 6. No per-track insert effects beyond filter/sends
Users cannot add distortion, chorus, or EQ per track. **ROI: medium-high.** Add an insert effects rack (distortion, chorus, EQ, compressor) per track with a small UI in the Inspector.

### 7. Preset sounds remain stock
Even with macros, the starting presets are plain. **ROI: medium.** Ship style-specific factory presets (e.g., "Oxygene Bass", "Kavinsky Lead") that set instrument + macros together.

## Recommended priority order

1. **Automation lanes** — turns static macros into evolving tracks; biggest composition win.
2. **Category-aware macro editor** — makes sound design faster and more musical.
3. **Per-track insert effects rack** — adds character without rebuilding the instrument library.
4. **MIDI device/channel selector + quantize** — makes recording reliable.
5. **Factory style presets** — improves out-of-the-box sound quality.

## Deployment

- Vercel production: https://gravsystem.vercel.app
- GitHub: `postro75/GRAVSYSTEM`
