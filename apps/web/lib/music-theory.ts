export type Scale = 'major' | 'minor';

const KEY_INDEX: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

const SCALE_INTERVALS: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const CHORD_INTERVALS: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  min: [0, 3, 7],
  maj7: [0, 4, 7, 11],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
};

const CHORD_PATTERN = /([A-G][#b]?)(m(?:in)?|maj7?|7|sus4|dim|aug)?/;

export function noteToMidi(note: string): number {
  const parsed = note.match(CHORD_PATTERN);
  if (!parsed) return 60;
  const key = parsed[1];
  return ((KEY_INDEX[key] ?? 0) + 60) % 128;
}

export interface ParsedChord {
  root: number;
  notes: number[];
}

export function parseChord(chordName: string, octave = 4): ParsedChord {
  const parsed = chordName.match(CHORD_PATTERN);
  if (!parsed) return { root: 0, notes: [60, 64, 67] };
  const key = parsed[1];
  const suffix = parsed[2] || '';
  const root = KEY_INDEX[key] ?? 0;
  const intervals = CHORD_INTERVALS[suffix] ?? CHORD_INTERVALS[''];
  const baseMidi = (octave + 1) * 12 + root;
  const notes = intervals.map((interval) => baseMidi + interval);
  return { root, notes };
}

export function scaleNotes(key: string, scale: Scale, octave = 4): number[] {
  const root = KEY_INDEX[key] ?? 0;
  const intervals = SCALE_INTERVALS[scale] ?? SCALE_INTERVALS.minor;
  const baseMidi = (octave + 1) * 12 + root;
  return intervals.map((interval) => baseMidi + interval);
}

const STYLE_PROGRESSIONS: Record<string, Record<string, string[]>> = {
  jarre: {
    minor: ['Dm', 'C', 'Bb', 'A'],
    major: ['C', 'G/B', 'Am', 'F'],
  },
  ambient: {
    minor: ['Am', 'G', 'F', 'G'],
    major: ['C', 'G/B', 'Am', 'F'],
  },
  synthwave: {
    minor: ['Am', 'F', 'Dm', 'G'],
    major: ['F', 'G', 'Em', 'Am'],
  },
  dance: {
    minor: ['Dm', 'Bb', 'F', 'C'],
    major: ['C', 'G', 'Am', 'F'],
  },
  electro: {
    minor: ['Dm', 'A', 'Gm', 'Bb'],
    major: ['C', 'Am', 'F', 'G'],
  },
  house: {
    minor: ['Am', 'F', 'C', 'G'],
    major: ['C', 'G', 'Am', 'F'],
  },
  techno: {
    minor: ['Dm', 'Gm', 'A', 'Dm'],
    major: ['Cm', 'Gm', 'Ab', 'Bb'],
  },
};

export function defaultProgression(scale: Scale, style: string): string[] {
  const styleMap = STYLE_PROGRESSIONS[style] ?? STYLE_PROGRESSIONS.dance;
  return styleMap[scale] ?? styleMap.minor;
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function transposeProgression(
  progression: string[],
  targetKey: string,
  scale: Scale = 'minor'
): string[] {
  const sourceRoot = parseChord(progression[0]).root;
  const targetRoot = KEY_INDEX[targetKey] ?? 0;
  const offset = targetRoot - sourceRoot;

  const hasFlat = targetKey.includes('b');
  const hasSharp = targetKey.includes('#');
  const useFlats = hasFlat || (scale === 'minor' && !hasSharp);
  const names = useFlats ? FLAT_NAMES : SHARP_NAMES;

  return progression.map((chord) => {
    const parsed = chord.match(CHORD_PATTERN);
    if (!parsed) return chord;
    const key = parsed[1];
    const suffix = parsed[2] || '';
    const keyIndex = KEY_INDEX[key] ?? 0;
    const newIndex = (keyIndex + offset + 12) % 12;
    return names[newIndex] + suffix;
  });
}

export function defaultTrackLayout(style: string): string[] {
  const layouts: Record<string, string[]> = {
    jarre: ['Drums', 'Bass Seq', 'Arpeggio 1', 'Arpeggio 2', 'Pad', 'String Pad', 'Lead', 'FX'],
    ambient: ['Drone', 'Pad', 'Arpeggio', 'Bass', 'Lead', 'FX'],
    techno: ['Kick', 'Hats', 'Bass', 'Stab', 'Arpeggio', 'Pad'],
    synthwave: ['Drums', 'Bass', 'Arpeggio', 'Pad', 'Lead'],
    dance: ['Drums', 'Bass', 'Chords', 'Lead', 'FX'],
    electro: ['Drums', 'Bass', 'Chords', 'Lead', 'FX'],
    house: ['Drums', 'Bass', 'Chords', 'Lead', 'FX'],
  };
  return layouts[style] ?? ['Drums', 'Bass', 'Arpeggio', 'Pad', 'Lead'];
}

export function defaultPatternType(trackName: string, style: string): string {
  const name = trackName.toLowerCase();
  if (name.includes('drum')) {
    if (style === 'jarre') return 'electronic_sparse';
    if (style === 'ambient') return 'ambient_textures';
    if (style === 'techno') return 'techno_drive';
    return 'four_on_floor';
  }
  if (name.includes('kick')) {
    return style === 'techno' ? 'techno_kick' : 'four_on_floor';
  }
  if (name.includes('hat')) {
    return style === 'techno' ? 'techno_hats' : 'hihat_16ths';
  }
  if (name.includes('bass')) {
    if (style === 'jarre') return 'analog_sequence';
    if (style === 'synthwave') return 'synthwave_bass';
    if (style === 'techno') return 'techno_bass';
    if (style === 'dance' || style === 'electro') return 'edm_bass';
    return 'root_fifth_octave';
  }
  if (name.includes('arpeggio')) {
    if (name.includes('1')) return style === 'jarre' ? 'arp_slow_up' : 'arp_16ths';
    return style === 'jarre' ? 'arp_slow_down' : 'arp_up';
  }
  if (name.includes('chords') || name.includes('stab')) {
    if (style === 'dance' || style === 'electro') return 'chord_stabs';
    if (style === 'techno') return 'stab_chords';
    return 'chords';
  }
  if (name.includes('string')) return 'string_pad';
  if (name.includes('pad') || name.includes('drone')) {
    return style === 'jarre' ? 'ambient_pad' : 'chords';
  }
  if (name.includes('lead')) {
    return style === 'jarre' ? 'oxygene_lead' : 'melody';
  }
  if (name.includes('fx')) return 'fx_markers';
  return 'chords';
}

export function defaultPatternTypes(layout: string[], style: string): Record<string, string> {
  return Object.fromEntries(layout.map((track) => [track, defaultPatternType(track, style)]));
}

export function styleBpm(style: string): number {
  const bpms: Record<string, number> = {
    jarre: 108,
    ambient: 90,
    synthwave: 110,
    techno: 130,
    house: 125,
    electro: 128,
  };
  return bpms[style] ?? 128;
}

export function styleBars(style: string): number {
  return style === 'jarre' || style === 'ambient' ? 32 : 16;
}

export function detectBpm(description: string): number | undefined {
  const match = description.match(/(\d+)\s*bpm/i);
  if (match) {
    return Math.max(60, Math.min(200, parseInt(match[1], 10)));
  }
  return undefined;
}

export function detectBars(description: string): number | undefined {
  const match = description.match(/(\d+)\s*(taktów|takty|bars?|measures?)/i);
  if (match) {
    return Math.max(8, Math.min(64, parseInt(match[1], 10)));
  }
  return undefined;
}

export interface DetectedKeyScale {
  key: string;
  scale: Scale;
}

export function detectKeyScale(description: string): DetectedKeyScale | undefined {
  const patterns = [
    /tonacja\s+([A-G][#b]?)\s*(dur|moll|mol)?/i,
    /\bw\s+([A-G][#b]?)\s*(dur|moll|mol)?/i,
    /key\s+of\s+([A-G][#b]?)\s*(major|minor)?/i,
    /\bin\s+([A-G][#b]?)\s*(major|minor)?/i,
    /\b([A-G][#b]?)\s+(major|minor)\b/i,
    /\b([A-G][#b]?)\s+(dur|moll|mol)\b/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const key = match[1].toUpperCase();
      const rawScale = (match[2] || 'minor').toLowerCase();
      const scale: Scale = rawScale === 'major' || rawScale === 'dur' ? 'major' : 'minor';
      return { key, scale };
    }
  }
  return undefined;
}

export function detectStyle(description: string): string {
  const lowered = description.toLowerCase();
  const keywords: Record<string, string> = {
    jarre: 'jarre',
    'jean-michel': 'jarre',
    oxygene: 'jarre',
    kavinsky: 'synthwave',
    synthwave: 'synthwave',
    guetta: 'dance',
    edm: 'dance',
    house: 'house',
    electro: 'electro',
    dance: 'dance',
    techno: 'techno',
    trance: 'techno',
    ambient: 'ambient',
  };
  for (const [keyword, style] of Object.entries(keywords)) {
    if (lowered.includes(keyword)) return style;
  }
  return 'dance';
}

export function extractChords(description: string): string[] | undefined {
  const chordRe = '(?<![A-Za-z])[A-G][#b]?(?:m(?:in)?|maj7?|7|sus4|dim|aug)?(?![A-Za-z])';
  const clusterMatch = description.match(
    new RegExp(
      `(?:akordy|chords?|progresja|progression)\\s*[:-]?\\s*((?:${chordRe}[,\\s]+){2,}${chordRe})`,
      'i'
    )
  );
  if (clusterMatch) {
    return clusterMatch[1].match(new RegExp(chordRe, 'g')) ?? undefined;
  }
  const matches = description.match(new RegExp(chordRe, 'g'));
  return matches && matches.length >= 3 ? matches : undefined;
}

export type Section = 'intro' | 'build' | 'drop' | 'break' | 'outro';

export interface ArrangementSection {
  section: Section;
  bars: number;
}

export interface GenerationConfig {
  bpm: number;
  bars: number;
  key: string;
  scale: Scale;
  style: string;
  chordProgression: string[];
  trackLayout: string[];
  patternTypes: Record<string, string>;
  description: string;
  arrangement: ArrangementSection[];
  humanize: boolean;
}

export function defaultArrangement(bars: number, style: string): ArrangementSection[] {
  // Ambient/Jarre: longer intro/outro, no drop
  if (style === 'ambient' || style === 'jarre') {
    if (bars >= 32) {
      return [
        { section: 'intro', bars: 8 },
        { section: 'build', bars: 8 },
        { section: 'drop', bars: 8 },
        { section: 'break', bars: 4 },
        { section: 'outro', bars: bars - 28 },
      ];
    }
    return [
      { section: 'intro', bars: 4 },
      { section: 'build', bars: 4 },
      { section: 'drop', bars: Math.max(4, bars - 12) },
      { section: 'outro', bars: 4 },
    ];
  }

  // Dance/EDM: clear build/drop
  if (bars >= 32) {
    return [
      { section: 'intro', bars: 8 },
      { section: 'build', bars: 8 },
      { section: 'drop', bars: 8 },
      { section: 'break', bars: 4 },
      { section: 'drop', bars: 4 },
      { section: 'outro', bars: bars - 32 },
    ];
  }
  if (bars >= 24) {
    return [
      { section: 'intro', bars: 4 },
      { section: 'build', bars: 8 },
      { section: 'drop', bars: 8 },
      { section: 'outro', bars: 4 },
    ];
  }
  return [
    { section: 'intro', bars: 4 },
    { section: 'build', bars: 4 },
    { section: 'drop', bars: Math.max(4, bars - 12) },
    { section: 'outro', bars: 4 },
  ];
}

export function buildConfig(
  description: string,
  overrides: Partial<GenerationConfig> = {}
): GenerationConfig {
  const style = overrides.style || detectStyle(description);
  const bpm = overrides.bpm ?? detectBpm(description) ?? styleBpm(style);
  const bars = overrides.bars ?? detectBars(description) ?? styleBars(style);
  const detected = detectKeyScale(description);
  const key =
    overrides.key ??
    detected?.key ??
    (style === 'synthwave' ? 'A' : 'D');
  const scale = overrides.scale ?? detected?.scale ?? 'minor';
  const explicitChords = extractChords(description);
  const progression = explicitChords
    ? transposeProgression(explicitChords, key, scale)
    : transposeProgression(defaultProgression(scale, style), key, scale);
  const layout = overrides.trackLayout ?? defaultTrackLayout(style);
  const patternTypes = overrides.patternTypes ?? defaultPatternTypes(layout, style);
  const arrangement = overrides.arrangement ?? defaultArrangement(bars, style);
  const humanize = overrides.humanize ?? true;

  return {
    bpm,
    bars,
    key,
    scale,
    style,
    chordProgression: progression,
    trackLayout: layout,
    patternTypes,
    description,
    arrangement,
    humanize,
  };
}
