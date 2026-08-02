# Tone.js Browser Preview

## Architektura

- `lib/tone-engine.ts` tworzy instancję `TonePlayer` dla danego `MusicConfig`.
- Generuje eventy MIDI przez `generateMidiEvents` (ten sam kod co dla eksportu).
- Mapuje ścieżki MIDI na instrumenty Tone.js:
  - Kick → `MembraneSynth`
  - Snare / Clap → `NoiseSynth`
  - Hihat → `MetalSynth`
  - Bass → `MonoSynth` (sawtooth + filter)
  - Pad / String → `PolySynth` (sawtooth)
  - Arpeggio → `PolySynth` (triangle/sawtooth)
  - Lead → `MonoSynth` (sine/square)
  - Drone / FX → `PolySynth`
- Efekty master: Reverb, FeedbackDelay, Compressor, Limiter.

## Użycie

```tsx
import { TonePlayer } from '@/lib/tone-engine';

const player = new TonePlayer(config, setState);
await player.init();
player.play();
player.pause();
player.dispose();
```

## Ograniczenia

- Jakość dźwięku zależy od syntezatorów Tone.js — dobra do preview, ale nie zastąpi prawdziwych sample library.
- Wymaga interakcji użytkownika (kliknięcie) przed startem audio context.
- Duże projekty (64 bary, 8 ścieżek) mogą obciążać CPU w przeglądarce.

## Pomysły na rozbudowę

- Zamienić syntezatory na sample-based (`Tone.Sampler`) z krótkimi sampleami kick/snare/hihat.
- Dodać więcej efektów per-style (np. sidechain compression dla dance, chorus dla padów).
- Dodać wizualizację audio (`Tone.Waveform` / `Tone.Meter`).
