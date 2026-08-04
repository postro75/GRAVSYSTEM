import * as Tone from 'tone';
import { InstrumentParams, DEFAULT_INSTRUMENT_PARAMS } from '@gravsystem/core';

export type { InstrumentParams };
export { DEFAULT_INSTRUMENT_PARAMS };

export function clampInstrumentParams(params: Partial<InstrumentParams>): InstrumentParams {
  return {
    attack: Math.max(0, Math.min(5, params.attack ?? DEFAULT_INSTRUMENT_PARAMS.attack)),
    decay: Math.max(0, Math.min(5, params.decay ?? DEFAULT_INSTRUMENT_PARAMS.decay)),
    sustain: Math.max(0, Math.min(1, params.sustain ?? DEFAULT_INSTRUMENT_PARAMS.sustain)),
    release: Math.max(0, Math.min(10, params.release ?? DEFAULT_INSTRUMENT_PARAMS.release)),
    cutoff: Math.max(20, Math.min(20000, params.cutoff ?? DEFAULT_INSTRUMENT_PARAMS.cutoff)),
    resonance: Math.max(0, Math.min(20, params.resonance ?? DEFAULT_INSTRUMENT_PARAMS.resonance)),
    reverb: Math.max(0, Math.min(1, params.reverb ?? DEFAULT_INSTRUMENT_PARAMS.reverb)),
    delay: Math.max(0, Math.min(1, params.delay ?? DEFAULT_INSTRUMENT_PARAMS.delay)),
  };
}

export const STYLE_INSTRUMENT_PARAMS: Record<string, Partial<InstrumentParams>> = {
  jarre: {
    attack: 0.08,
    decay: 0.3,
    sustain: 0.75,
    release: 1.2,
    cutoff: 6000,
    resonance: 1.2,
    reverb: 0.45,
    delay: 0.35,
  },
  ambient: {
    attack: 0.6,
    decay: 0.4,
    sustain: 0.9,
    release: 2.0,
    cutoff: 4000,
    resonance: 0.8,
    reverb: 0.6,
    delay: 0.25,
  },
  synthwave: {
    attack: 0.03,
    decay: 0.25,
    sustain: 0.8,
    release: 0.7,
    cutoff: 8000,
    resonance: 1.5,
    reverb: 0.35,
    delay: 0.3,
  },
  dance: {
    attack: 0.005,
    decay: 0.15,
    sustain: 0.85,
    release: 0.35,
    cutoff: 12000,
    resonance: 2.0,
    reverb: 0.2,
    delay: 0.15,
  },
  electro: {
    attack: 0.005,
    decay: 0.12,
    sustain: 0.8,
    release: 0.3,
    cutoff: 14000,
    resonance: 2.5,
    reverb: 0.15,
    delay: 0.1,
  },
  house: {
    attack: 0.005,
    decay: 0.18,
    sustain: 0.85,
    release: 0.4,
    cutoff: 11000,
    resonance: 1.8,
    reverb: 0.25,
    delay: 0.2,
  },
  techno: {
    attack: 0.002,
    decay: 0.1,
    sustain: 0.75,
    release: 0.25,
    cutoff: 20000,
    resonance: 3.0,
    reverb: 0.12,
    delay: 0.08,
  },
};

export function defaultParamsForStyle(style: string): InstrumentParams {
  const styleDefaults = STYLE_INSTRUMENT_PARAMS[style.toLowerCase()] ?? {};
  return clampInstrumentParams({ ...DEFAULT_INSTRUMENT_PARAMS, ...styleDefaults });
}

export type ToneSynth = Tone.PolySynth | Tone.MonoSynth | Tone.DuoSynth | Tone.FMSynth | Tone.AMSynth;

export function applyInstrumentParams(synth: unknown, params: InstrumentParams): void {
  if (
    !(synth instanceof Tone.PolySynth) &&
    !(synth instanceof Tone.MonoSynth) &&
    !(synth instanceof Tone.DuoSynth) &&
    !(synth instanceof Tone.FMSynth) &&
    !(synth instanceof Tone.AMSynth)
  ) {
    return;
  }
  const envelope = {
    attack: params.attack,
    decay: params.decay,
    sustain: params.sustain,
    release: params.release,
  };

  if (synth instanceof Tone.MonoSynth) {
    synth.set({
      envelope,
      filterEnvelope: { ...envelope, baseFrequency: params.cutoff },
      filter: { Q: params.resonance },
    });
    return;
  }

  if (synth instanceof Tone.DuoSynth) {
    const voiceEnvelope = { ...envelope, baseFrequency: params.cutoff };
    synth.set({
      voice0: { envelope, filterEnvelope: voiceEnvelope },
      voice1: { envelope, filterEnvelope: voiceEnvelope },
    });
    return;
  }

  if (synth instanceof Tone.FMSynth || synth instanceof Tone.AMSynth) {
    synth.set({ envelope });
    return;
  }

  if (synth instanceof Tone.PolySynth) {
    synth.set({ envelope });
    return;
  }
}

export function createTrackFilter(params: InstrumentParams): Tone.Filter {
  return new Tone.Filter({
    frequency: params.cutoff,
    Q: params.resonance,
    type: 'lowpass',
    rolloff: -24,
  });
}

export function createSendGain(): Tone.Gain {
  return new Tone.Gain(0);
}

export function formatParamValue(key: keyof InstrumentParams, value: number): string {
  switch (key) {
    case 'attack':
    case 'decay':
    case 'release':
      return `${(value * 1000).toFixed(0)} ms`;
    case 'cutoff':
      return value >= 1000 ? `${(value / 1000).toFixed(1)} kHz` : `${Math.round(value)} Hz`;
    case 'resonance':
      return `${value.toFixed(1)} Q`;
    case 'sustain':
    case 'reverb':
    case 'delay':
      return `${Math.round(value * 100)}%`;
    default:
      return `${value}`;
  }
}
