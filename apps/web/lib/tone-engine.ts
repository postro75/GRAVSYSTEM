import * as Tone from 'tone';
import { Project } from '@gravsystem/core';

export interface TonePlayerState {
  isPlaying: boolean;
  isReady: boolean;
  error: string | null;
}

function noteToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function _drumNoteName(trackName: string): string {
  const name = trackName.toLowerCase();
  if (name.includes('kick')) return 'C1';
  if (name.includes('snare')) return 'D1';
  if (name.includes('hat')) return 'F#1';
  if (name.includes('clap')) return 'A1';
  return 'C1';
}

function createDrums() {
  const baseUrl = '/samples/';
  const options = {
    attack: 0,
    release: 0.1,
  };

  const kick = new Tone.Sampler({ C1: `${baseUrl}kick.wav` }, options).toDestination();
  kick.volume.value = -2;

  const snare = new Tone.Sampler({ D1: `${baseUrl}snare.wav` }, options).toDestination();
  snare.volume.value = -6;

  const hihat = new Tone.Sampler({ 'F#1': `${baseUrl}hihat.wav` }, options).toDestination();
  hihat.volume.value = -12;

  const clap = new Tone.Sampler({ A1: `${baseUrl}clap.wav` }, options).toDestination();
  clap.volume.value = -5;

  return { kick, snare, hihat, clap };
}

function createBass() {
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

function createPad() {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.3, decay: 0.1, sustain: 0.8, release: 1.0 },
  });
  synth.volume.value = -10;
  return synth;
}

function createArpeggio() {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.3 },
  });
  synth.volume.value = -12;
  return synth;
}

function createLead() {
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'square' },
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

function createStab() {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.2 },
  });
  synth.volume.value = -9;
  return synth;
}

function createDrone() {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 1.0, decay: 0.5, sustain: 1.0, release: 2.0 },
  });
  synth.volume.value = -14;
  return synth;
}

function getInstrumentForTrack(
  trackName: string,
  drums: ReturnType<typeof createDrums>
): Tone.PolySynth | Tone.MonoSynth | Tone.Sampler {
  const name = trackName.toLowerCase();
  if (name.includes('kick')) return drums.kick;
  if (name.includes('snare')) return drums.snare;
  if (name.includes('hat')) return drums.hihat;
  if (name.includes('drum')) return drums.kick;
  if (name.includes('clap')) return drums.clap;
  if (name.includes('bass')) return createBass();
  if (name.includes('pad') || name.includes('string')) return createPad();
  if (name.includes('drone')) return createDrone();
  if (name.includes('arpeggio')) return createArpeggio();
  if (name.includes('chords') || name.includes('stab')) return createStab();
  if (name.includes('lead')) return createLead();
  return createPad();
}

export class TonePlayer {
  private project: Project | null = null;
  private parts: Tone.Part[] = [];
  private instruments: Tone.ToneAudioNode[] = [];
  private effects: Tone.ToneAudioNode[] = [];
  private isStarted = false;
  private onStateChange?: (state: TonePlayerState) => void;
  private animationFrame?: number;

  constructor(onStateChange?: (state: TonePlayerState) => void) {
    this.onStateChange = onStateChange;
  }

  async init() {
    try {
      await Tone.start();
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

  loadProject(project: Project) {
    this.project = project;
    this.disposeParts();
    this.buildChain();
    Tone.Transport.bpm.value = project.bpm;
    const totalSeconds = project.bars * 4 * (60 / project.bpm);
    Tone.Transport.loop = true;
    Tone.Transport.loopStart = 0;
    Tone.Transport.loopEnd = totalSeconds;
  }

  private disposeParts() {
    this.parts.forEach((part) => part.dispose());
    this.instruments.forEach((inst) => inst.dispose());
    this.parts = [];
    this.instruments = [];
  }

  private buildChain() {
    if (!this.project) return;

    const reverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.02, wet: 0.25 }).toDestination();
    const delay = new Tone.FeedbackDelay('8n.', 0.25).connect(reverb);
    const compressor = new Tone.Compressor(-18, 3).connect(delay);
    const limiter = new Tone.Limiter(-1).toDestination();
    compressor.connect(limiter);
    this.effects = [reverb, delay, compressor, limiter];

    const drums = createDrums();

    for (const track of this.project.tracks) {
      const instrument = getInstrumentForTrack(track.name, drums);
      this.instruments.push(instrument);

      const isDrum =
        track.name.toLowerCase().includes('drum') ||
        track.name.toLowerCase().includes('kick') ||
        track.name.toLowerCase().includes('hat') ||
        track.name.toLowerCase().includes('clap');

      if (!isDrum && 'connect' in instrument) {
        instrument.disconnect();
        instrument.connect(compressor);
      }

      const notes = track.regions.flatMap((region) =>
        region.midiEvents.map((evt) => ({
          time: (evt.start / this.project!.bpm) * 60,
          note: evt.pitch,
          noteName: isDrum ? _drumNoteName(track.name) : undefined,
          duration: Math.max(0.01, (evt.duration / this.project!.bpm) * 60),
          velocity: evt.velocity / 127,
        }))
      );

      if (notes.length === 0) continue;

      const part = new Tone.Part((time, value) => {
        const freq = noteToFreq(value.note);
        const vel = value.velocity;

        if (instrument instanceof Tone.Sampler) {
          instrument.triggerAttackRelease(value.noteName || 'C1', value.duration, time, vel);
        } else if (instrument instanceof Tone.PolySynth || instrument instanceof Tone.MonoSynth) {
          instrument.triggerAttackRelease(freq, value.duration, time, vel);
        }
      }, notes as any);

      part.start(0);
      this.parts.push(part);
    }
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

  getPositionSeconds(): number {
    return Tone.Transport.seconds;
  }

  getPositionBeats(): number {
    return Tone.Transport.position ? Tone.Time(Tone.Transport.position).toSeconds() * (this.project?.bpm ?? 120) / 60 : 0;
  }

  dispose() {
    this.disposeParts();
    this.effects.forEach((eff) => eff.dispose());
    Tone.Transport.cancel(0);
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }

  private emitState(state: TonePlayerState) {
    this.onStateChange?.(state);
  }
}
