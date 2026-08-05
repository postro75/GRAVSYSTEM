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
      return 'hihatClosed';
    case DRUM_NOTES.hihatOpen:
      return 'hihatOpen';
    case DRUM_NOTES.crash:
      return 'crash';
    default:
      return null;
  }
}

/**
 * A richer synthetic drum kit that avoids the "laser" hihat sound.
 * Kick has sub weight + click, snare mixes body and noise, hats use
 * band-passed noise, clap uses a multi-burst envelope.
 */
export class SynthDrumKit {
  readonly output: Tone.Gain;
  readonly kick: {
    body: Tone.MembraneSynth;
    click: Tone.MembraneSynth;
  };
  readonly snare: {
    body: Tone.MembraneSynth;
    wires: Tone.NoiseSynth;
  };
  readonly hihatClosed: Tone.NoiseSynth;
  readonly hihatOpen: Tone.NoiseSynth;
  readonly clap: Tone.NoiseSynth;
  readonly crash: Tone.NoiseSynth;

  constructor() {
    this.output = new Tone.Gain(1);

    // Kick: deep sine body + short click for attack.
    this.kick = {
      body: new Tone.MembraneSynth({
        pitchDecay: 0.06,
        octaves: 6,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.55, sustain: 0, release: 0.35 },
        volume: -1,
      }).connect(this.output),
      click: new Tone.MembraneSynth({
        pitchDecay: 0.01,
        octaves: 2,
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 },
        volume: -14,
      }).connect(this.output),
    };

    // Snare: tuned body + noisy wires.
    this.snare = {
      body: new Tone.MembraneSynth({
        pitchDecay: 0.03,
        octaves: 3,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.08 },
        volume: -6,
      }).connect(this.output),
      wires: new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.1 },
        volume: -8,
      }).connect(this.output),
    };

    // Hihats: band-passed white noise, not MetalSynth.
    const hatFilter = new Tone.Filter(9000, 'bandpass', -24);
    const hatVolume = new Tone.Volume(-12).connect(this.output);
    hatFilter.connect(hatVolume);

    this.hihatClosed = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.03 },
      volume: -2,
    }).connect(hatFilter);

    this.hihatOpen = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.15 },
      volume: -2,
    }).connect(hatFilter);

    // Clap: four quick bursts.
    this.clap = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.001, decay: 0.14, sustain: 0, release: 0.08 },
      volume: -5,
    }).connect(this.output);

    // Crash: pink noise with long decay.
    this.crash = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: { attack: 0.01, decay: 1.2, sustain: 0, release: 0.8 },
      volume: -7,
    }).connect(this.output);
  }

  trigger(pitch: number, duration: number, time: number, velocity: number) {
    const sample = drumSampleName(pitch);
    if (!sample) return;

    const vel = Math.max(0, Math.min(1, velocity));

    switch (sample) {
      case 'kick':
        this.kick.body.triggerAttackRelease('C1', duration, time, vel);
        this.kick.click.triggerAttackRelease('G3', 0.03, time, vel * 0.6);
        break;
      case 'snare':
        this.snare.body.triggerAttackRelease('D2', duration, time, vel * 0.5);
        this.snare.wires.triggerAttackRelease(duration, time, vel * 0.85);
        break;
      case 'clap': {
        // Multi-burst clap: four closely spaced noise bursts.
        const gap = 0.012;
        for (let i = 0; i < 4; i++) {
          const burstVel = vel * (1 - i * 0.18);
          this.clap.triggerAttackRelease(0.04, time + i * gap, burstVel);
        }
        break;
      }
      case 'hihatClosed':
        this.hihatClosed.triggerAttackRelease(0.05, time, vel * 0.8);
        break;
      case 'hihatOpen':
        this.hihatOpen.triggerAttackRelease(0.25, time, vel * 0.8);
        break;
      case 'crash':
        this.crash.triggerAttackRelease(duration * 4, time, vel);
        break;
    }
  }

  dispose() {
    this.kick.body.dispose();
    this.kick.click.dispose();
    this.snare.body.dispose();
    this.snare.wires.dispose();
    this.hihatClosed.dispose();
    this.hihatOpen.dispose();
    this.clap.dispose();
    this.crash.dispose();
    this.output.dispose();
  }
}

/**
 * Sample-based drum kit with velocity-sensitive playback.
 * Expects WAV samples at /samples/{kick,snare,clap,hihat}.wav.
 */
export class SampleDrumKit {
  readonly output: Tone.Gain;
  readonly kick: Tone.Sampler;
  readonly snare: Tone.Sampler;
  readonly clap: Tone.Sampler;
  readonly hihat: Tone.Sampler;

  constructor() {
    this.output = new Tone.Gain(1);
    const baseUrl = '/samples/';
    const options = { attack: 0, release: 0.1 };

    this.kick = new Tone.Sampler({ C1: `${baseUrl}kick.wav` }, options).connect(this.output);
    this.kick.volume.value = -2;

    this.snare = new Tone.Sampler({ D1: `${baseUrl}snare.wav` }, options).connect(this.output);
    this.snare.volume.value = -6;

    this.clap = new Tone.Sampler({ A1: `${baseUrl}clap.wav` }, options).connect(this.output);
    this.clap.volume.value = -5;

    this.hihat = new Tone.Sampler({ 'F#1': `${baseUrl}hihat.wav` }, options).connect(this.output);
    this.hihat.volume.value = -12;
  }

  trigger(pitch: number, duration: number, time: number, velocity: number) {
    const sample = drumSampleName(pitch);
    if (!sample) return;
    const vel = Math.max(0, Math.min(1, velocity));
    const noteName =
      sample === 'kick' ? 'C1' :
      sample === 'snare' ? 'D1' :
      sample === 'clap' ? 'A1' :
      'F#1';

    switch (sample) {
      case 'kick':
        this.kick.triggerAttackRelease(noteName, duration, time, vel);
        break;
      case 'snare':
        this.snare.triggerAttackRelease(noteName, duration, time, vel);
        break;
      case 'clap':
        this.clap.triggerAttackRelease(noteName, duration, time, vel);
        break;
      case 'hihatClosed':
      case 'hihatOpen':
        this.hihat.triggerAttackRelease(noteName, duration, time, vel * 0.8);
        break;
    }
  }

  dispose() {
    this.kick.dispose();
    this.snare.dispose();
    this.clap.dispose();
    this.hihat.dispose();
    this.output.dispose();
  }
}
