# Open Source DAW / Sequencer Analysis for GRAVSYSTEM

Scope: identify free/open-source browser and desktop DAWs, sequencers, VST hosts, and supporting audio libraries that GRAVSYSTEM can reuse, learn from, or integrate. Emphasis on **UX quality**, **code usefulness**, and **license safety**.

## Executive summary

| Project | Type | Lang / Stack | Stars | License | UX quality | Usefulness for GRAVSYSTEM | Verdict |
|---|---|---|---|---|---|---|---|
| [funkybeats](https://github.com/pepperonas/funkybeats) | Browser DAW | JS, Web Audio API | 1 | n/a (public) | **High** — FL-style step sequencer, drag-to-paint, per-step probability | Step-sequencer UX patterns, channel-rack model, Euclidean generator | **High priority reference** |
| [OpenStudio](https://github.com/808StaN/OpenStudio) | Browser + Desktop DAW | React, Web Audio API, Electron | 51 | MIT | **High** — clip arrange view, piano roll, mixer, AI agent | Piano-roll velocity lane, scale highlighting, grid snapping, MP3 export via lamejs, theming | **High priority reference** |
| [waveform-playlist](https://github.com/naomiaro/waveform-playlist) | Web audio editor | TypeScript, Web Audio API | 1,664 | MIT | **Medium-High** — Audacity-style multitrack waveform editor | Waveform visualization, audio-track editing, time-shift, fades, export | **Adopt when adding audio tracks** |
| [ableton-inspector](https://github.com/owenbush/ableton-inspector) | ALS parser / viewer | TypeScript | 10 | n/a (public) | N/A — developer tool | Validate our `.als` export against real Ableton files | **Useful for QA** |
| [oliver-little/sequencer](https://github.com/oliver-little/sequencer) | Browser sequencer | TypeScript, Web Audio API | 6 | n/a (public) | **Medium** — basic track + effects chain | Effect chaining architecture, custom time signatures | **Low priority** |
| [UI_Shout_DAW_Web_Browser](https://github.com/dakariuishmg/UI_Shout_DAW_Web_Browser) | Browser DAW | HTML / vanilla JS | 1 | n/a (public) | **Low-Medium** — raw UI, incomplete | Very little reusable code | **Skip** |
| [OpenDaw](https://github.com/glenwrhodes/OpenDaw) | Desktop DAW | C++, Qt 6, Tracktion Engine | 26 | n/a (public) | **Medium-High** — full VST3 host, piano roll, notation | Reference for VST3 hosting, but not directly reusable in browser | **Reference only** |
| [VCV Rack 2 Free](https://github.com/VCVRack/Rack) | Modular synth host | C++ | ~10k+ | GPL-3.0 | **High** — Eurorack UI, patch cables | Modular UX concepts, real-time DSP patterns | **Reference only** |

*All star counts and license data are current as of the research date and may change.*

---

## 1. Browser DAWs — direct competitors / references

### 1.1 funkybeats
- **What it is:** FL Studio-inspired electronic music studio in the browser.
- **Best UX features:**
  - 11-channel step sequencer (Kick, Snare, HiHat, Clap, Perc, Bass, Lead, Pad, Chord, Stab, Organ).
  - Variable pattern length (16 / 32 / 64 steps).
  - 8 independent patterns with copy/paste/clear.
  - **Drag-to-paint** steps.
  - **Per-step probability** with dashed-border visual feedback.
  - Euclidean sequencer (Björklund algorithm).
  - Open-hihat toggle with closed-hat choke.
  - Live playhead and step indicators.
- **What GRAVSYSTEM can steal:**
  - Replace the current drum track piano roll with a **dedicated step sequencer** for drums.
  - Per-step probability and velocity for humanized grooves.
  - Pattern banks (A/B/C…) for verse/chorus variations.
- **Risk:** 1 star, very new repo; code quality unknown; no explicit license yet. Treat as reference, do not copy code verbatim.

### 1.2 OpenStudio
- **What it is:** React + Electron DAW with AI agent, browser and desktop builds.
- **Best UX features:**
  - Clip-based arrange view (playlist).
  - Piano roll with **velocity lane**, **scale highlighting**, and **grid snapping**.
  - Track mixer with sends/returns.
  - MP3 export via `lamejs`.
  - AI agent for melody/drum/mixer/FX suggestions.
- **What GRAVSYSTEM can steal:**
  - Piano-roll polish (velocity lane, scale highlighting, snap settings).
  - Theming via CSS custom properties instead of hardcoded colors.
  - `lamejs` integration for MP3 export.
- **Risk:** MIT license, 51 stars, actively updated. Safe to study and borrow architecture patterns.

### 1.3 oliver-little/sequencer
- **What it is:** TypeScript web DAW with custom time signatures and chained effects.
- **Best UX features:**
  - Effect chains per track.
  - WAV export.
  - Save/load workflows.
- **What GRAVSYSTEM can steal:**
  - Serialization format ideas.
  - Effect-chain graph (currently GRAVSYSTEM uses a fixed insert chain).
- **Risk:** Stale (last push 2023), no license. Reference only.

---

## 2. Audio-track / waveform libraries

### 2.1 waveform-playlist
- **What it is:** Multitrack Web Audio editor with canvas waveform preview.
- **Best features:**
  - Canvas waveform rendering.
  - Cues, fades, time-shifting.
  - Record audio tracks or annotate.
  - Export to `AudioBuffer` or WAV.
  - Tone.js effect integration.
- **What GRAVSYSTEM can steal:**
  - Drop audio files onto tracks and see waveforms.
  - Audio region trimming, fades, and snapping.
- **Risk:** MIT, 1.6k stars, mature. **Adopt when GRAVSYSTEM adds audio tracks.**

---

## 3. Export / interoperability tools

### 3.1 ableton-inspector
- **What it is:** Browser app that parses Ableton Live `.als` files (gzip → XML) and extracts tempo, key, structure, samples, tracks.
- **What GRAVSYSTEM can steal:**
  - Use it to **validate** our `.als` export against real Ableton sets.
  - Borrow the XML/gzip parsing pipeline if we want a two-way `.als` import.
- **Risk:** Public repo, 10 stars. Good for QA, not for embedding without license check.

---

## 4. Desktop / VST-only references

### 4.1 OpenDaw
- C++/Qt 6 + Tracktion Engine desktop DAW.
- Full VST3 instrument/effect hosting, piano roll, notation, Claude AI assistant.
- **Use:** reference for VST3 hosting architecture; not reusable in browser stack.

### 4.2 VCV Rack 2 Free
- Open-source virtual Eurorack modular synth (GPL-3.0).
- **Use:** reference for modular UX and real-time DSP patterns; license incompatible with proprietary reuse.

---

## 5. Recommended next steps for GRAVSYSTEM

### Immediate (Phase 17 candidates)
1. **Fix the audio-start UX bug** — queue `loadProject` until `Tone.start()` is allowed, then auto-load. *(Done in this session.)*
2. **Adopt a dedicated step sequencer for drums**
   - Use `funkybeats` as the UX reference.
   - 16/32/64 steps, drag-to-paint, per-step velocity/probability.
   - Keep the existing piano roll for melodic tracks.
3. **Validate `.als` export**
   - Run generated `.als` files through `ableton-inspector` and fix mismatches.
4. **Piano-roll UX lift from OpenStudio**
   - Velocity lane.
   - Scale/key highlighting.
   - Configurable grid snap (1/4, 1/8, 1/16, triplet, free).

### Medium term
5. **Theming via CSS custom properties** — replace hardcoded `bg-apple-*` colors with variables.
6. **Waveform audio tracks** — integrate `waveform-playlist` when adding audio recording/import.
7. **MP3 export** — add `lamejs` alongside existing WAV/MIDI/REAPER/ALS exports.
8. **Pattern banks / phrase memory** — let generated clips have A/B variations and repeatable hooks.

### Low priority / reference only
9. Study OpenDaw / VCV Rack for VST3 hosting if GRAVSYSTEM ever moves to a desktop Electron build.

---

## 6. License notes

- MIT projects (`OpenStudio`, `waveform-playlist`) are safe to study, fork, and reuse with attribution.
- GPL projects (`VCV Rack`) are **not** compatible with a proprietary / closed-source GRAVSYSTEM build.
- Repos without an explicit license (`funkybeats`, `ableton-inspector`, `UI_Shout_DAW_Web_Browser`) should be treated as **reference only**; do not copy code verbatim.

---

*Research performed for GRAVSYSTEM Phase 17 planning. URLs verified via GitHub API and web search.*
