# C++ Audio Engine Plan — GRAVSYSTEM

## Objective
Replace the Python/DawDreamer backend render path and the toy JUCE synth in the desktop app with a real C++ audio engine that can:
- Load a GRAVSYSTEM project JSON.
- Play it back in real time (low latency, multi-track, MIDI + synth).
- Bounce to WAV offline without Python.
- Eventually host external plugins (VST3/AU/CLAP).

## Recommended stack

| Layer | Choice | Why |
|-------|--------|-----|
| Audio I/O & plugin hosting | JUCE (already used) | Mature, cross-platform, handles CoreAudio/WASAPI/ASIO and VST3/AU wrappers. |
| Sequencer / project model / offline render | Tracktion Engine | High-level DAW engine from the JUCE authors. Gives us tracks, clips, MIDI, audio, automation, undo, plugin hosting, and headless bounce. |
| File I/O | libsndfile | Industry standard for WAV/AIFF/FLAC/OGG. |
| SRC | libsamplerate | Reference quality sample-rate conversion. |
| Time-stretch (future) | Rubber Band | High-quality musical time-stretch (GPL2/commercial). |
| Web ↔ desktop bridge | Local WebSocket on localhost | Low latency for transport/preview control from the Next.js UI. |
| Project persistence / cloud render | FastAPI backend | Keep for project JSON storage and heavy offline jobs. |

## License watch
Tracktion Engine is dual GPL3 / commercial. GRAVSYSTEM is currently open-source, so GPL3 is fine for now. If we ever ship a closed-source commercial binary or bundle proprietary plugins, we must buy a Tracktion Engine commercial license.

## Architecture

```
desktop/
├── CMakeLists.txt
├── src/
│   ├── app/              # existing JUCE GUI app (MainComponent, etc.)
│   ├── engine/           # Tracktion-based audio engine
│   │   ├── Engine.cpp
│   │   ├── Engine.h
│   │   └── RenderMain.cpp   # headless offline render executable
│   ├── synth/            # our own synths as JUCE AudioProcessors
│   ├── io/               # JSON project import/export (existing ProjectModel)
│   └── ipc/              # local WebSocket control server (future)
└── third_party/
    ├── JUCE/             # existing FetchContent
    ├── tracktion_engine/ # new submodule
    ├── libsndfile/       # new submodule or FetchContent
    └── libsamplerate/    # new submodule or FetchContent
```

## Milestones

### Milestone 1 — Headless offline render (this phase)
1. Add `tracktion_engine` as a submodule under `desktop/third_party/`.
2. Add `libsndfile` as a submodule/FetchContent.
3. Create `desktop/src/engine/RenderMain.cpp`:
   - Load a GRAVSYSTEM JSON project.
   - Build a Tracktion `Edit` with tempo, tracks, and MIDI clips.
   - Render 8 seconds to WAV.
4. Wire it into CMake as a separate executable `gravsystem-render`.
5. Verify output WAV has non-zero audio.

### Milestone 2 — Real-time playback in desktop app
1. Create `Engine` class wrapping Tracktion `Engine` and `Edit`.
2. Replace the simple `AudioEngine` synth in `MainComponent` with the Tracktion-based engine.
3. Play/stop transport controls drive Tracktion transport.

### Milestone 3 — Plugin hosting
1. Enable `JUCE_PLUGINHOST_VST3` and `JUCE_PLUGINHOST_AU`.
2. Map GRAVSYSTEM instrument IDs to plugin IDs or internal synths.
3. Load one external VST3 synth as a proof of concept.

### Milestone 4 — Web ↔ desktop bridge
1. Add a localhost WebSocket server inside the desktop app.
2. Forward play/stop/preview/render commands from the Next.js frontend.
3. Keep FastAPI for project persistence and cloud renders.

## Reference projects to study
- `JUCE/extras/AudioPluginHost` — plugin hosting patterns.
- `Tracktion/tracktion_engine/examples` — Edit, render, transport basics.
- `helio-fm/helio-sequencer` — modern JUCE sequencer UI.
- `monocasual/giada` — small JUCE host with VST3 support.

## Concrete next action
Start Milestone 1: add the Tracktion Engine submodule and build a minimal headless render.
