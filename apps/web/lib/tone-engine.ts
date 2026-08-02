import * as Tone from 'tone';
import { MusicConfig } from './types';
import { generateMidiEvents } from './midi';

export interface TonePlayerState {
  isPlaying: boolean;
  isReady: boolean;
  error: string | null;
}

function noteToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function createDrums() {
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 10,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
  }).toDestination();
  kick.volume.value = -2;

  const snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
  }).toDestination();
  snare.volume.value = -6;

  const hihat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.04, release: 0.01 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).toDestination();
  hihat.volume.value = -12;

  const clap = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 },
  }).toDestination();
  clap.volume.value = -5;

  return { kick, snare, hihat, clap };
}

function createBass(style: string) {
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.7, release: 0.2 },
    filterEnvelope: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.6,
      release: 0.2,
      baseFrequency: 100,
      octaves: 2.5,
      exponent: 2,
    },
  });
  synth.volume.value = -4;
  return synth;
}

function createPad(style: string) {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.3, decay: 0.1, sustain: 0.8, release: 1.0 },
  });
  synth.volume.value = -10;
  return synth;
}

function createArpeggio(style: string) {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: style === 'jarre' ? 'triangle' : 'sawtooth' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.3 },
  });
  synth.volume.value = -12;
  return synth;
}

function createLead(style: string) {
  const synth = new Tone.MonoSynth({
    oscillator: { type: style === 'jarre' ? 'sine' : 'square' },
    envelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.5 },
    filterEnvelope: {
      attack: 0.05,
      decay: 0.2,
      sustain: 0.6,
      release: 0.4,
      baseFrequency: 400,
      octaves: 2,
      exponent: 2,
    },
  });
  synth.volume.value = -8;
  return synth;
}

function createStab(style: string) {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.2 },
  });
  synth.volume.value = -9;
  return synth;
}

function createDrone(style: string) {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 1.0, decay: 0.5, sustain: 1.0, release: 2.0 },
  });
  synth.volume.value = -14;
  return synth;
}

function getInstrumentForTrack(
  trackName: string,
  style: string,
  drums: ReturnType<typeof createDrums>
): Tone.PolySynth | Tone.MonoSynth | Tone.MembraneSynth | Tone.NoiseSynth | Tone.MetalSynth {
  const name = trackName.toLowerCase();
  if (name.includes('kick')) return drums.kick;
  if (name.includes('snare')) return drums.snare;
  if (name.includes('hat')) return drums.hihat;
  if (name.includes('drum')) return drums.kick;
  if (name.includes('clap')) return drums.clap;
  if (name.includes('bass')) return createBass(style);
  if (name.includes('pad') || name.includes('string')) return createPad(style);
  if (name.includes('drone')) return createDrone(style);
  if (name.includes('arpeggio')) return createArpeggio(style);
  if (name.includes('chords') || name.includes('stab')) return createStab(style);
  if (name.includes('lead')) return createLead(style);
  return createPad(style);
}

export class TonePlayer {
  private config: MusicConfig;
  private parts: Tone.Part[] = [];
  private instruments: (Tone.ToneAudioNode | undefined)[] = [];
  private effects: Tone.ToneAudioNode[] = [];
  private isStarted = false;
  private onStateChange?: (state: TonePlayerState) => void;

  constructor(config: MusicConfig, onStateChange?: (state: TonePlayerState) => void) {
    this.config = config;
    this.onStateChange = onStateChange;
  }

  async init() {
    try {
      await Tone.start();
      this.buildChain();
      this.schedule();
      this.isStarted = true;
      this.emitState({ isPlaying: false, isReady: true, error: null });
    } catch (err) {
      this.emitState({
        isPlaying: false,
        isReady: false,
        error: err instanceof Error ? err.message : 'Tone.js init failed',
      });
    }
  }

  private buildChain() {
    // Master effects
    const reverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.02, wet: 0.25 }).toDestination();
    const delay = new Tone.FeedbackDelay('8n.', 0.25).connect(reverb);
    const compressor = new Tone.Compressor(-18, 3).connect(delay);
    const limiter = new Tone.Limiter(-1).toDestination();
    compressor.connect(limiter);

    this.effects = [reverb, delay, compressor, limiter];

    const drums = createDrums();
    const eventsByTrack = generateMidiEvents(this.config);

    for (const [trackName, events] of eventsByTrack) {
      const instrument = getInstrumentForTrack(trackName, this.config.style, drums);
      this.instruments.push(instrument);

      // Connect non-drums through master effects chain
      const isDrum =
        trackName.toLowerCase().includes('drum') ||
        trackName.toLowerCase().includes('kick') ||
        trackName.toLowerCase().includes('hat') ||
        trackName.toLowerCase().includes('clap');

      if (!isDrum) {
        instrument.disconnect();
        instrument.connect(compressor);
      }

      const notes = events.map((evt) => ({
        time: evt.time / 480 / this.config.bpm * 60,
        note: evt.note,
        duration: Math.max(0.01, evt.duration / 480 / this.config.bpm * 60),
        velocity: evt.velocity / 127,
      }));

      const part = new Tone.Part((time, value) => {
        const freq = noteToFreq(value.note);
        const vel = value.velocity;

        if (instrument instanceof Tone.MembraneSynth) {
          instrument.triggerAttackRelease(freq, value.duration, time, vel);
        } else if (instrument instanceof Tone.NoiseSynth) {
          instrument.triggerAttackRelease(value.duration, time, vel);
        } else if (instrument instanceof Tone.MetalSynth) {
          instrument.triggerAttackRelease(value.duration, time, vel);
        } else if (instrument instanceof Tone.PolySynth || instrument instanceof Tone.MonoSynth) {
          instrument.triggerAttackRelease(freq, value.duration, time, vel);
        }
      }, notes as any);

      part.start(0);
      this.parts.push(part);
    }

    // Set transport loop and BPM
    Tone.Transport.bpm.value = this.config.bpm;
    const totalSeconds = this.config.bars * 4 * (60 / this.config.bpm);
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = totalSeconds;
  }

  private schedule() {
    Tone.Transport.cancel(0);
    this.parts.forEach((part) => part.dispose());
    this.parts = [];
    this.buildChain();
  }

  play() {
    if (!this.isStarted) return;
    Tone.Transport.start('+0.05');
    this.emitState({ isPlaying: true, isReady: true, error: null });
  }

  pause() {
    Tone.Transport.pause();
    this.emitState({ isPlaying: false, isReady: true, error: null });
  }

  stop() {
    Tone.Transport.stop();
    Tone.Transport.position = '0:0:0';
    this.emitState({ isPlaying: false, isReady: true, error: null });
  }

  dispose() {
    this.parts.forEach((part) => part.dispose());
    this.instruments.forEach((inst) => inst?.dispose());
    this.effects.forEach((eff) => eff.dispose());
    Tone.Transport.cancel(0);
  }

  private emitState(state: TonePlayerState) {
    this.onStateChange?.(state);
  }
}
