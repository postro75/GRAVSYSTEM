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
