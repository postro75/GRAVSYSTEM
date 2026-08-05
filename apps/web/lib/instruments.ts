import * as Tone from 'tone';
import { mulberry32 } from './music-theory';

export type InstrumentType = 'custom' | 'soundfont' | 'drums';

export interface InstrumentDefinition {
  id: string;
  name: string;
  category: 'bass' | 'lead' | 'pad' | 'arp' | 'chords' | 'drums' | 'keys' | 'strings' | 'fx';
  type: InstrumentType;
  config: 'synth' | string; // 'synth' for custom builders, soundfont name, or kit name
  color: string;
  /** Short hint shown in the picker. */
  description?: string;
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
  { id: 'jarre-bass', name: 'Jarre Bass', category: 'bass', type: 'custom', config: 'synth', color: '#f59e0b', description: 'Moog-style analog bass with filter sweep' },
  { id: 'jarre-bass-seq', name: 'Jarre Seq Bass', category: 'bass', type: 'custom', config: 'synth', color: '#f59e0b', description: 'Hypnotic sequenced bass for Oxygène' },
  { id: 'kavinsky-bass', name: 'Kavinsky Bass', category: 'bass', type: 'custom', config: 'synth', color: '#f59e0b', description: 'Punchy side-chain synthwave bass' },
  { id: 'synthwave-bass', name: 'Synthwave Bass', category: 'bass', type: 'custom', config: 'synth', color: '#f59e0b', description: 'Wide detuned saw bass' },
  { id: 'dance-bass', name: 'Dance Bass', category: 'bass', type: 'custom', config: 'synth', color: '#f59e0b', description: 'Tight EDM bass' },
  { id: 'acid-bass', name: 'Acid Bass', category: 'bass', type: 'custom', config: 'synth', color: '#f59e0b', description: 'Resonant 303-style acid' },

  // Lead
  { id: 'jarre-lead', name: 'Jarre Lead', category: 'lead', type: 'custom', config: 'synth', color: '#ec4899', description: 'Slowly evolving analog lead' },
  { id: 'jarre-brass', name: 'Jarre Brass', category: 'lead', type: 'custom', config: 'synth', color: '#ec4899', description: 'Oxygène-style analog brass' },
  { id: 'kavinsky-lead', name: 'Kavinsky Lead', category: 'lead', type: 'custom', config: 'synth', color: '#ec4899', description: 'Detuned saw anthem lead' },
  { id: 'synthwave-lead', name: 'Synthwave Lead', category: 'lead', type: 'custom', config: 'synth', color: '#ec4899', description: 'Bright retro lead' },
  { id: 'guetta-lead', name: 'Guetta Lead', category: 'lead', type: 'custom', config: 'synth', color: '#ec4899', description: 'Big-room festival lead' },
  { id: 'dance-lead', name: 'Dance Lead', category: 'lead', type: 'custom', config: 'synth', color: '#ec4899', description: 'Energetic electro lead' },
  { id: 'fm-lead', name: 'FM Lead', category: 'lead', type: 'custom', config: 'synth', color: '#ec4899', description: 'Bell-like FM lead' },

  // Pads
  { id: 'jarre-pad', name: 'Jarre Space Pad', category: 'pad', type: 'custom', config: 'synth', color: '#3b82f6', description: 'Vast space pad with slow filter' },
  { id: 'kavinsky-pad', name: 'Kavinsky Pad', category: 'pad', type: 'custom', config: 'synth', color: '#3b82f6', description: 'Side-chained saw pad' },
  { id: 'warm-pad', name: 'Warm Pad', category: 'pad', type: 'custom', config: 'synth', color: '#3b82f6', description: 'Soft unison pad' },
  { id: 'string-pad', name: 'String Pad', category: 'pad', type: 'custom', config: 'synth', color: '#60a5fa', description: 'Orchestral string pad' },
  { id: 'choir-pad', name: 'Choir Drone', category: 'pad', type: 'custom', config: 'synth', color: '#818cf8', description: 'Ethereal choir drone' },

  // Arps
  { id: 'jarre-arp', name: 'Jarre Arp', category: 'arp', type: 'custom', config: 'synth', color: '#22c55e', description: 'Slow hypnotic arpeggio' },
  { id: 'kavinsky-arp', name: 'Kavinsky Arp', category: 'arp', type: 'custom', config: 'synth', color: '#22c55e', description: 'Driving 16th arp' },
  { id: 'fm-arp', name: 'FM Arp', category: 'arp', type: 'custom', config: 'synth', color: '#22c55e', description: 'Glassy FM arpeggio' },
  { id: 'pluck-arp', name: 'Pluck Arp', category: 'arp', type: 'custom', config: 'synth', color: '#22c55e', description: 'Fast plucked arp' },

  // Chords / Stabs
  { id: 'jarre-chords', name: 'Jarre Chords', category: 'chords', type: 'custom', config: 'synth', color: '#a855f7', description: 'Wide analog chord pad' },
  { id: 'square-chords', name: 'Square Chords', category: 'chords', type: 'custom', config: 'synth', color: '#a855f7', description: 'Vintage square-wave chords' },
  { id: 'brass-stab', name: 'Brass Stab', category: 'chords', type: 'custom', config: 'synth', color: '#d946ef', description: 'Short brass stab' },
  { id: 'guetta-chords', name: 'Guetta Chords', category: 'chords', type: 'custom', config: 'synth', color: '#a855f7', description: 'Big-room chord stab' },

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
  { id: 'sci-fi-fx', name: 'Sci-Fi FX', category: 'fx', type: 'custom', config: 'synth', color: '#14b8a6', description: 'Rising sci-fi effect' },
  { id: 'jarre-fx', name: 'Jarre FX', category: 'fx', type: 'custom', config: 'synth', color: '#14b8a6', description: 'Space swoosh and noise' },
];

export function getInstrumentById(id: string): InstrumentDefinition | undefined {
  return INSTRUMENTS.find((inst) => inst.id === id);
}

export function getInstrumentsByCategory(category: InstrumentDefinition['category']): InstrumentDefinition[] {
  return INSTRUMENTS.filter((inst) => inst.category === category);
}

function categoryFromTrackName(trackName: string): InstrumentDefinition['category'] {
  const name = trackName.toLowerCase();
  if (name.includes('drum') || name.includes('kick') || name.includes('hat') || name.includes('clap')) return 'drums';
  if (name.includes('bass')) return 'bass';
  if (name.includes('lead')) return 'lead';
  if (name.includes('drone')) return 'pad';
  if (name.includes('pad') || name.includes('string')) return 'pad';
  if (name.includes('arpeggio')) return 'arp';
  if (name.includes('chords')) return 'chords';
  if (name.includes('stab')) return 'chords';
  if (name.includes('fx')) return 'fx';
  return 'pad';
}

export const STYLE_INSTRUMENT_PALETTE: Record<
  string,
  Partial<Record<InstrumentDefinition['category'], string[]>>
> = {
  jarre: {
    bass: ['jarre-bass', 'jarre-bass-seq'],
    lead: ['jarre-lead', 'jarre-brass'],
    pad: ['jarre-pad', 'string-pad', 'choir-pad'],
    arp: ['jarre-arp', 'fm-arp'],
    chords: ['jarre-chords', 'square-chords'],
    drums: ['synth-drums', 'sample-drums'],
    fx: ['jarre-fx', 'sci-fi-fx'],
  },
  ambient: {
    bass: ['jarre-bass'],
    lead: ['jarre-lead'],
    pad: ['jarre-pad', 'choir-pad', 'string-pad'],
    arp: ['jarre-arp', 'fm-arp'],
    chords: ['jarre-chords'],
    drums: ['sample-drums', 'synth-drums'],
    fx: ['jarre-fx', 'sci-fi-fx'],
  },
  synthwave: {
    bass: ['kavinsky-bass', 'synthwave-bass'],
    lead: ['kavinsky-lead', 'synthwave-lead'],
    pad: ['kavinsky-pad', 'warm-pad', 'string-pad'],
    arp: ['kavinsky-arp', 'pluck-arp', 'fm-arp'],
    chords: ['square-chords', 'jarre-chords'],
    drums: ['synth-drums', 'sample-drums'],
    fx: ['sci-fi-fx'],
  },
  dance: {
    bass: ['dance-bass', 'acid-bass'],
    lead: ['guetta-lead', 'dance-lead', 'fm-lead'],
    pad: ['warm-pad', 'kavinsky-pad'],
    arp: ['pluck-arp', 'kavinsky-arp'],
    chords: ['guetta-chords', 'square-chords', 'brass-stab'],
    drums: ['sample-drums', 'synth-drums'],
    fx: ['sci-fi-fx'],
  },
  electro: {
    bass: ['acid-bass', 'dance-bass'],
    lead: ['fm-lead', 'dance-lead'],
    pad: ['warm-pad', 'kavinsky-pad'],
    arp: ['pluck-arp', 'kavinsky-arp', 'fm-arp'],
    chords: ['brass-stab', 'square-chords', 'guetta-chords'],
    drums: ['sample-drums', 'synth-drums'],
    fx: ['sci-fi-fx'],
  },
  house: {
    bass: ['dance-bass', 'kavinsky-bass'],
    lead: ['dance-lead', 'guetta-lead', 'fm-lead'],
    pad: ['warm-pad', 'string-pad'],
    arp: ['pluck-arp', 'kavinsky-arp'],
    chords: ['square-chords', 'brass-stab', 'guetta-chords'],
    drums: ['sample-drums', 'synth-drums'],
    fx: ['sci-fi-fx'],
  },
  techno: {
    bass: ['acid-bass', 'dance-bass'],
    lead: ['fm-lead', 'dance-lead'],
    pad: ['warm-pad'],
    arp: ['pluck-arp', 'fm-arp'],
    chords: ['brass-stab'],
    drums: ['sample-drums', 'synth-drums'],
    fx: ['sci-fi-fx'],
  },
};

export function inferInstrumentForTrack(trackName: string, style = 'dance'): string {
  const name = trackName.toLowerCase();
  const s = style.toLowerCase();
  const category = categoryFromTrackName(trackName);
  const palette = STYLE_INSTRUMENT_PALETTE[s]?.[category];

  if (palette && palette.length > 0) {
    const rng = mulberry32(trackName.length * 31 + s.length * 17 + 42);
    return palette[Math.floor(rng() * palette.length)];
  }

  // Fallback to the previous heuristic for unstyled categories.
  if (name.includes('drum') || name.includes('kick') || name.includes('hat') || name.includes('clap')) {
    return 'synth-drums';
  }
  if (name.includes('bass')) {
    if (s === 'jarre' || s === 'ambient') return 'jarre-bass';
    if (s === 'synthwave') return 'kavinsky-bass';
    return 'dance-bass';
  }
  if (name.includes('lead')) {
    if (s === 'jarre' || s === 'ambient') return 'jarre-lead';
    if (s === 'synthwave') return 'kavinsky-lead';
    return 'guetta-lead';
  }
  if (name.includes('pad') || name.includes('string')) {
    if (s === 'jarre' || s === 'ambient') return 'jarre-pad';
    if (s === 'synthwave') return 'kavinsky-pad';
    return 'warm-pad';
  }
  if (name.includes('drone')) return 'choir-pad';
  if (name.includes('arpeggio')) {
    if (s === 'jarre' || s === 'ambient') return 'jarre-arp';
    if (s === 'synthwave') return 'kavinsky-arp';
    return 'pluck-arp';
  }
  if (name.includes('chords')) {
    if (s === 'jarre' || s === 'ambient') return 'jarre-chords';
    if (s === 'dance' || s === 'electro' || s === 'house') return 'guetta-chords';
    return 'square-chords';
  }
  if (name.includes('stab')) return 'brass-stab';
  if (name.includes('fx')) return s === 'jarre' || s === 'ambient' ? 'jarre-fx' : 'sci-fi-fx';
  return 'warm-pad';
}

export function createCustomSynth(instrumentId: string): Tone.PolySynth | Tone.MonoSynth | Tone.DuoSynth | Tone.FMSynth | Tone.AMSynth {
  switch (instrumentId) {
    case 'jarre-bass':
      return new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.02, decay: 0.35, sustain: 0.55, release: 0.9 },
        filterEnvelope: { attack: 0.08, decay: 0.5, sustain: 0.35, release: 0.7, baseFrequency: 80, octaves: 3.5, exponent: 2 },
        filter: { Q: 2.0, type: 'lowpass', rolloff: -24 },
        portamento: 0.04,
      });
    case 'jarre-bass-seq':
      return new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.5, release: 0.25 },
        filterEnvelope: { attack: 0.02, decay: 0.25, sustain: 0.3, release: 0.3, baseFrequency: 120, octaves: 3, exponent: 2 },
        filter: { Q: 2.5, type: 'lowpass', rolloff: -24 },
        portamento: 0.06,
      });
    case 'kavinsky-bass':
      return new Tone.MonoSynth({
        oscillator: { type: 'fatsawtooth', count: 2, spread: 18 },
        envelope: { attack: 0.005, decay: 0.22, sustain: 0.75, release: 0.35 },
        filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.55, release: 0.35, baseFrequency: 110, octaves: 2.5, exponent: 2 },
        filter: { Q: 2.2, type: 'lowpass', rolloff: -24 },
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
        vibratoAmount: 0.12,
        vibratoRate: 4.5,
        harmonicity: 1.15,
        voice0: { oscillator: { type: 'fatsawtooth', count: 2, spread: 14 }, envelope: { attack: 0.1, decay: 0.25, sustain: 0.8, release: 1.0 }, filterEnvelope: { attack: 0.15, decay: 0.4, sustain: 0.7, release: 0.9, baseFrequency: 400, octaves: 2.5 } },
        voice1: { oscillator: { type: 'triangle' }, envelope: { attack: 0.12, decay: 0.3, sustain: 0.75, release: 1.1 }, filterEnvelope: { attack: 0.18, decay: 0.5, sustain: 0.65, release: 1.0, baseFrequency: 350, octaves: 2.5 } },
      });
    case 'jarre-brass':
      return new Tone.DuoSynth({
        vibratoAmount: 0.08,
        vibratoRate: 5,
        harmonicity: 1.25,
        voice0: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.18, decay: 0.3, sustain: 0.85, release: 0.7 }, filterEnvelope: { attack: 0.2, decay: 0.4, sustain: 0.75, release: 0.6, baseFrequency: 450, octaves: 2 } },
        voice1: { oscillator: { type: 'square' }, envelope: { attack: 0.2, decay: 0.35, sustain: 0.8, release: 0.7 }, filterEnvelope: { attack: 0.22, decay: 0.45, sustain: 0.7, release: 0.65, baseFrequency: 400, octaves: 2 } },
      });
    case 'kavinsky-lead':
      return new Tone.DuoSynth({
        vibratoAmount: 0.04,
        vibratoRate: 6,
        harmonicity: 1.5,
        voice0: { oscillator: { type: 'fatsawtooth', count: 3, spread: 22 }, envelope: { attack: 0.03, decay: 0.12, sustain: 0.85, release: 0.5 }, filterEnvelope: { attack: 0.04, decay: 0.15, sustain: 0.8, release: 0.45, baseFrequency: 700, octaves: 2 } },
        voice1: { oscillator: { type: 'fatsawtooth', count: 3, spread: 26 }, envelope: { attack: 0.03, decay: 0.12, sustain: 0.85, release: 0.5 }, filterEnvelope: { attack: 0.04, decay: 0.15, sustain: 0.8, release: 0.45, baseFrequency: 650, octaves: 2 } },
      });
    case 'synthwave-lead':
      return new Tone.DuoSynth({
        vibratoAmount: 0.05,
        vibratoRate: 6,
        harmonicity: 1.5,
        voice0: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5 }, filterEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5, baseFrequency: 600, octaves: 2 } },
        voice1: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5 }, filterEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5, baseFrequency: 600, octaves: 2 } },
      });
    case 'guetta-lead':
      return new Tone.DuoSynth({
        vibratoAmount: 0.06,
        vibratoRate: 5.5,
        harmonicity: 1.4,
        voice0: { oscillator: { type: 'fatsawtooth', count: 3, spread: 20 }, envelope: { attack: 0.04, decay: 0.18, sustain: 0.9, release: 0.55 }, filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.85, release: 0.5, baseFrequency: 800, octaves: 2.5 } },
        voice1: { oscillator: { type: 'square' }, envelope: { attack: 0.04, decay: 0.18, sustain: 0.9, release: 0.55 }, filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.85, release: 0.5, baseFrequency: 750, octaves: 2.5 } },
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

    case 'jarre-pad':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 16 },
        envelope: { attack: 0.8, decay: 0.4, sustain: 0.9, release: 2.2 },
      });
    case 'kavinsky-pad':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 20 },
        envelope: { attack: 0.4, decay: 0.3, sustain: 0.85, release: 1.4 },
      });
    case 'warm-pad':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 2, spread: 12 },
        envelope: { attack: 0.4, decay: 0.2, sustain: 0.8, release: 1.4 },
      });
    case 'string-pad':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 14 },
        envelope: { attack: 0.7, decay: 0.3, sustain: 0.85, release: 2.0 },
      });
    case 'choir-pad':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 1.0, decay: 0.5, sustain: 1.0, release: 2.5 },
      });

    case 'jarre-arp':
      return new Tone.FMSynth({
        harmonicity: 2,
        modulationIndex: 5,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.02, decay: 0.25, sustain: 0.35, release: 0.9 },
        modulation: { type: 'triangle' },
        modulationEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.25, release: 0.5 },
      });
    case 'kavinsky-arp':
      return new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 12,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.12, sustain: 0.4, release: 0.35 },
        modulation: { type: 'square' },
        modulationEnvelope: { attack: 0.005, decay: 0.1, sustain: 0.2, release: 0.25 },
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
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.5 },
        modulation: { type: 'square' },
        modulationEnvelope: { attack: 0.005, decay: 0.1, sustain: 0.2, release: 0.3 },
      });

    case 'jarre-chords':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 2, spread: 10 },
        envelope: { attack: 0.2, decay: 0.2, sustain: 0.75, release: 1.2 },
      });
    case 'guetta-chords':
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.12, sustain: 0.55, release: 0.35 },
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
    case 'jarre-fx':
      return new Tone.AMSynth({
        harmonicity: 2,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.3, decay: 0.8, sustain: 0.2, release: 2.0 },
        modulation: { type: 'sine' },
        modulationEnvelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1.5 },
      });

    default:
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.5 },
      });
  }
}
