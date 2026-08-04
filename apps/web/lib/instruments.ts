import * as Tone from 'tone';

export type InstrumentType = 'custom' | 'soundfont' | 'drums';

export interface InstrumentDefinition {
  id: string;
  name: string;
  category: 'bass' | 'lead' | 'pad' | 'arp' | 'chords' | 'drums' | 'keys' | 'strings' | 'fx';
  type: InstrumentType;
  config: 'synth' | string; // 'synth' for custom builders, soundfont name, or kit name
  color: string;
}

export const INSTRUMENT_CATEGORIES: Record<InstrumentDefinition['category'], string> = {
  bass: 'Bass',
  lead: 'Lead',
  pad: 'Pads',
  arp: 'Arpeggios',
  chords: 'Chords / Stabs',
  drums: 'Drums',
  keys: 'Keys',
  strings: 'Strings',
  fx: 'FX',
};

export const INSTRUMENTS: InstrumentDefinition[] = [
  // Bass
  { id: 'jarre-bass', name: 'Jarre Bass', category: 'bass', type: 'custom', config: 'synth', color: '#f59e0b' },
  { id: 'synthwave-bass', name: 'Synthwave Bass', category: 'bass', type: 'custom', config: 'synth', color: '#f59e0b' },
  { id: 'dance-bass', name: 'Dance Bass', category: 'bass', type: 'custom', config: 'synth', color: '#f59e0b' },
  { id: 'acid-bass', name: 'Acid Bass', category: 'bass', type: 'custom', config: 'synth', color: '#f59e0b' },

  // Lead
  { id: 'jarre-lead', name: 'Jarre Lead', category: 'lead', type: 'custom', config: 'synth', color: '#ec4899' },
  { id: 'synthwave-lead', name: 'Synthwave Lead', category: 'lead', type: 'custom', config: 'synth', color: '#ec4899' },
  { id: 'dance-lead', name: 'Dance Lead', category: 'lead', type: 'custom', config: 'synth', color: '#ec4899' },
  { id: 'fm-lead', name: 'FM Lead', category: 'lead', type: 'custom', config: 'synth', color: '#ec4899' },

  // Pads
  { id: 'warm-pad', name: 'Warm Pad', category: 'pad', type: 'custom', config: 'synth', color: '#3b82f6' },
  { id: 'string-pad', name: 'String Pad', category: 'pad', type: 'custom', config: 'synth', color: '#60a5fa' },
  { id: 'choir-pad', name: 'Choir Drone', category: 'pad', type: 'custom', config: 'synth', color: '#818cf8' },

  // Arps
  { id: 'fm-arp', name: 'FM Arp', category: 'arp', type: 'custom', config: 'synth', color: '#22c55e' },
  { id: 'pluck-arp', name: 'Pluck Arp', category: 'arp', type: 'custom', config: 'synth', color: '#22c55e' },

  // Chords / Stabs
  { id: 'square-chords', name: 'Square Chords', category: 'chords', type: 'custom', config: 'synth', color: '#a855f7' },
  { id: 'brass-stab', name: 'Brass Stab', category: 'chords', type: 'custom', config: 'synth', color: '#d946ef' },

  // Keys (SoundFont GM)
  { id: 'acoustic-piano', name: 'Acoustic Piano', category: 'keys', type: 'soundfont', config: 'acoustic_grand_piano', color: '#f43f5e' },
  { id: 'electric-piano', name: 'Electric Piano', category: 'keys', type: 'soundfont', config: 'electric_piano_1', color: '#f43f5e' },
  { id: 'marimba', name: 'Marimba', category: 'keys', type: 'soundfont', config: 'marimba', color: '#f43f5e' },
  { id: 'vibraphone', name: 'Vibraphone', category: 'keys', type: 'soundfont', config: 'vibraphone', color: '#f43f5e' },

  // Strings (SoundFont GM)
  { id: 'strings', name: 'Orchestral Strings', category: 'strings', type: 'soundfont', config: 'synth_strings_1', color: '#60a5fa' },
  { id: 'choir', name: 'Choir Aahs', category: 'strings', type: 'soundfont', config: 'choir_aahs', color: '#60a5fa' },

  // Drums
  { id: 'synth-drums', name: 'Synth Drum Kit', category: 'drums', type: 'drums', config: 'synth', color: '#ef4444' },
  { id: 'sample-drums', name: 'Sample Drum Kit', category: 'drums', type: 'drums', config: 'sample', color: '#ef4444' },

  // FX
  { id: 'sci-fi-fx', name: 'Sci-Fi FX', category: 'fx', type: 'custom', config: 'synth', color: '#14b8a6' },
];

export function getInstrumentById(id: string): InstrumentDefinition | undefined {
  return INSTRUMENTS.find((inst) => inst.id === id);
}

export function getInstrumentsByCategory(category: InstrumentDefinition['category']): InstrumentDefinition[] {
  return INSTRUMENTS.filter((inst) => inst.category === category);
}

export function inferInstrumentForTrack(trackName: string, style = 'dance'): string {
  const name = trackName.toLowerCase();
  const s = style.toLowerCase();

  if (name.includes('drum') || name.includes('kick') || name.includes('hat') || name.includes('clap')) {
    return 'synth-drums';
  }
  if (name.includes('bass')) {
    if (s === 'jarre' || s === 'ambient') return 'jarre-bass';
    if (s === 'synthwave') return 'synthwave-bass';
    return 'dance-bass';
  }
  if (name.includes('lead')) {
    if (s === 'jarre' || s === 'ambient') return 'jarre-lead';
    if (s === 'synthwave') return 'synthwave-lead';
    return 'dance-lead';
  }
  if (name.includes('pad') || name.includes('string')) {
    if (name.includes('string')) return 'string-pad';
    return 'warm-pad';
  }
  if (name.includes('drone')) return 'choir-pad';
  if (name.includes('arpeggio')) {
    if (s === 'jarre' || s === 'ambient') return 'fm-arp';
    return 'pluck-arp';
  }
  if (name.includes('chords')) return 'square-chords';
  if (name.includes('stab')) return 'brass-stab';
  if (name.includes('fx')) return 'sci-fi-fx';
  return 'warm-pad';
}

export function createCustomSynth(instrumentId: string): Tone.PolySynth | Tone.MonoSynth | Tone.DuoSynth | Tone.FMSynth | Tone.AMSynth {
  switch (instrumentId) {
    case 'jarre-bass':
      return new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.02, decay: 0.35, sustain: 0.5, release: 0.6 },
        filterEnvelope: { attack: 0.05, decay: 0.4, sustain: 0.35, release: 0.6, baseFrequency: 60, octaves: 3, exponent: 2 },
        filter: { Q: 1.5, type: 'lowpass', rolloff: -24 },
      });
    case 'synthwave-bass':
      return new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.005, decay: 0.25, sustain: 0.7, release: 0.5 },
        filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.5, release: 0.4, baseFrequency: 100, octaves: 2.5, exponent: 2 },
        filter: { Q: 2.5, type: 'lowpass', rolloff: -24 },
      });
    case 'acid-bass':
      return new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.005, decay: 0.18, sustain: 0.4, release: 0.2 },
        filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.2, baseFrequency: 150, octaves: 4, exponent: 2 },
        filter: { Q: 8, type: 'lowpass', rolloff: -24 },
      });
    case 'dance-bass':
      return new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.005, decay: 0.18, sustain: 0.65, release: 0.35 },
        filterEnvelope: { attack: 0.005, decay: 0.15, sustain: 0.4, release: 0.3, baseFrequency: 90, octaves: 2.5, exponent: 2 },
        filter: { Q: 2.2, type: 'lowpass', rolloff: -24 },
      });

    case 'jarre-lead':
      return new Tone.DuoSynth({
        vibratoAmount: 0.15,
        vibratoRate: 4,
        harmonicity: 1.25,
        voice0: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.08, decay: 0.2, sustain: 0.75, release: 0.8 }, filterEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 0.8, baseFrequency: 350, octaves: 2.5 } },
        voice1: { oscillator: { type: 'triangle' }, envelope: { attack: 0.08, decay: 0.2, sustain: 0.75, release: 0.8 }, filterEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 0.8, baseFrequency: 350, octaves: 2.5 } },
      });
    case 'synthwave-lead':
      return new Tone.DuoSynth({
        vibratoAmount: 0.05,
        vibratoRate: 6,
        harmonicity: 1.5,
        voice0: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5 }, filterEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5, baseFrequency: 600, octaves: 2 } },
        voice1: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5 }, filterEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5, baseFrequency: 600, octaves: 2 } },
      });
    case 'fm-lead':
      return new Tone.FMSynth({
        harmonicity: 2,
        modulationIndex: 8,
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.6 },
        modulation: { type: 'square' },
        modulationEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.3 },
      });
    case 'dance-lead':
      return new Tone.DuoSynth({
        vibratoAmount: 0.08,
        vibratoRate: 5,
        harmonicity: 1.5,
        voice0: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.03, decay: 0.1, sustain: 0.75, release: 0.45 }, filterEnvelope: { attack: 0.03, decay: 0.1, sustain: 0.75, release: 0.45, baseFrequency: 450, octaves: 2 } },
        voice1: { oscillator: { type: 'square' }, envelope: { attack: 0.03, decay: 0.1, sustain: 0.75, release: 0.45 }, filterEnvelope: { attack: 0.03, decay: 0.1, sustain: 0.75, release: 0.45, baseFrequency: 450, octaves: 2 } },
      });

    case 'warm-pad':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.3, decay: 0.2, sustain: 0.8, release: 1.2 },
      });
    case 'string-pad':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.6, decay: 0.3, sustain: 0.85, release: 2.0 },
      });
    case 'choir-pad':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 1.0, decay: 0.5, sustain: 1.0, release: 2.5 },
      });

    case 'fm-arp':
      return new Tone.FMSynth({
        harmonicity: 2,
        modulationIndex: 6,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.8 },
        modulation: { type: 'triangle' },
        modulationEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.5 },
      });
    case 'pluck-arp':
      return new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 },
        modulation: { type: 'square' },
        modulationEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.3 },
      });

    case 'square-chords':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.4 },
      });
    case 'brass-stab':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.2 },
      });

    case 'sci-fi-fx':
      return new Tone.AMSynth({
        harmonicity: 2.5,
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.1, release: 1.0 },
        modulation: { type: 'square' },
        modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 },
      });

    default:
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.5 },
      });
  }
}
