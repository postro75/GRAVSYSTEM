# GRAVSYSTEM Desktop (C++ / JUCE)

Long-term desktop DAW built with [JUCE](https://juce.com/). Hosts VST3/AU plugins, provides native audio I/O, and imports projects from the web version.

## Prerequisites

- CMake 3.22+
- A C++17 compiler (Clang, GCC, MSVC)
- Git

## Build

```bash
cd desktop
mkdir -p build
cd build
cmake ..
cmake --build . --config Release
```

On macOS you can also generate an Xcode project:

```bash
cmake -G Xcode ..
```

## Architecture

- `main.cpp` — JUCE application entry point.
- `MainComponent.h/cpp` — main UI window.
- `AudioEngine.h/cpp` — `AudioDeviceManager` callback, transport, metronome.
- `PluginHost.h/cpp` — VST3 plugin scanning (`PluginDirectoryScanner`, `KnownPluginList`, `AudioPluginFormatManager`) and B3 load.
- `ProjectModel.h/cpp` — track/region/clip data model.

## Status

Skeleton project. Audio engine produces a metronome click. VST3 plugin scanning and B3 loading are wired in the UI. Sequencer and project import are planned next.
