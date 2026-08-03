import * as Tone from 'tone';

export const DRUM_NOTES = {
  kick: 36,
  snare: 38,
  clap: 39,
  hihatClosed: 42,
  hihatOpen: 46,
  crash: 49,
} as const;

export type DrumSample = 'kick' | 'snare' | 'clap' | 'hihatClosed' | 'hihatOpen' | 'crash';

function drumSampleName(pitch: number): DrumSample | null {
  switch (pitch) {
    case DRUM_NOTES.kick:
      return 'kick';
    case DRUM_NOTES.snare:
      return 'snare';
    case DRUM_NOTES.clap:
      return 'clap';
    case DRUM_NOTES.hihatClosed:
    case DRUM_NOTES.hihatOpen:
      return 'hihatClosed';
    case DRUM_NOTES.crash:
      return 'crash';
    default:
      return null;
  }
}

export class SynthDrumKit {
  readonly output: Tone.Gain;
  readonly kick: Tone.MembraneSynth;
  readonly snare: Tone.NoiseSynth;
  readonly clap: Tone.NoiseSynth;
  readonly hihat: Tone.MetalSynth;
  readonly crash: Tone.NoiseSynth;

  constructor() {
    this.output = new Tone.Gain(1);

    this.kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.4 },
      volume: -2,
    }).connect(this.output);

    this.snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
      volume: -4,
    }).connect(this.output);

    this.clap = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
      volume: -5,
    }).connect(this.output);

    this.hihat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.03 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 6000,
      octaves: 1.5,
      volume: -10,
    }).connect(this.output);

    this.crash = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.01, decay: 1.2, sustain: 0, release: 0.8 },
      volume: -8,
    }).connect(this.output);
  }

  trigger(pitch: number, duration: number, time: number, velocity: number) {
    const sample = drumSampleName(pitch);
    if (!sample) return;

    const vel = Math.max(0, Math.min(1, velocity));

    switch (sample) {
      case 'kick':
        this.kick.triggerAttackRelease('C1', duration, time, vel);
        break;
      case 'snare':
        this.snare.triggerAttackRelease(duration, time, vel);
        break;
      case 'clap':
        this.clap.triggerAttackRelease(duration, time, vel);
        break;
      case 'hihatClosed': {
        // Closed hats get a tighter envelope; open hats a longer one.
        const dur = pitch === DRUM_NOTES.hihatOpen ? duration * 4 : duration;
        this.hihat.triggerAttackRelease(dur, time, vel * 0.8);
        break;
      }
      case 'crash':
        this.crash.triggerAttackRelease(duration * 4, time, vel);
        break;
    }
  }

  dispose() {
    this.kick.dispose();
    this.snare.dispose();
    this.clap.dispose();
    this.hihat.dispose();
    this.crash.dispose();
    this.output.dispose();
  }
}
