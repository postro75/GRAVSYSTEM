export const KEY_INDEX: Record<string, number> = {
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
  7: [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
};

const CHORD_PATTERN = /([A-G][#b]?)(m(?:in)?|maj7?|7|sus4|dim|aug)?/;

export function noteToMidi(note: string): number {
  const parsed = CHORD_PATTERN.exec(note);
  if (!parsed) return 60;
  const [, key] = parsed;
  const base = KEY_INDEX[key] ?? 0;
  return base + 60;
}

export function parseChord(chordName: string, octave = 4): { root: number; notes: number[] } {
  const parsed = CHORD_PATTERN.exec(chordName);
  if (!parsed) {
    return { root: 0, notes: [60, 64, 67] };
  }
  const [, key, suffix] = parsed;
  const root = KEY_INDEX[key] ?? 0;
  const intervals = CHORD_INTERVALS[suffix || ''] || CHORD_INTERVALS[''];
  const baseMidi = (octave + 1) * 12 + root;
  const notes = intervals.map((interval) => baseMidi + interval);
  return { root, notes };
}

export function scaleNotes(key: string, scale: string, octave = 4): number[] {
  const root = KEY_INDEX[key] ?? 0;
  const intervals = SCALE_INTERVALS[scale] || SCALE_INTERVALS.minor;
  const baseMidi = (octave + 1) * 12 + root;
  return intervals.map((interval) => baseMidi + interval);
}

export const STYLE_PROGRESSIONS: Record<string, Record<string, string[]>> = {
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

export function defaultProgression(scale: string, style = 'dance'): string[] {
  const styleMap = STYLE_PROGRESSIONS[style] || STYLE_PROGRESSIONS.dance;
  return styleMap[scale] || styleMap.minor;
}

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function transposeProgression(
  progression: string[],
  targetKey: string,
  scale: 'major' | 'minor' = 'minor'
): string[] {
  const sourceRoot = parseChord(progression[0]).root;
  const targetRoot = KEY_INDEX[targetKey] ?? 0;
  const offset = targetRoot - sourceRoot;

  const hasFlat = targetKey.includes('b');
  const hasSharp = targetKey.includes('#');
  const useFlats = hasFlat || (scale === 'minor' && !hasSharp);
  const names = useFlats ? FLAT_NAMES : SHARP_NAMES;

  return progression.map((chord) => {
    const parsed = CHORD_PATTERN.exec(chord);
    if (!parsed) return chord;
    const [, _key, suffix] = parsed;
    const keyIndex = KEY_INDEX[_key] ?? 0;
    let newIndex = (keyIndex + offset) % 12;
    if (newIndex < 0) newIndex += 12;
    return names[newIndex] + (suffix || '');
  });
}

export function defaultTrackLayout(style: string): string[] {
  switch (style) {
    case 'jarre':
      return ['Drums', 'Bass Seq', 'Arpeggio 1', 'Arpeggio 2', 'Pad', 'String Pad', 'Lead', 'FX'];
    case 'ambient':
      return ['Drone', 'Pad', 'Arpeggio', 'Bass', 'Lead', 'FX'];
    case 'techno':
      return ['Kick', 'Hats', 'Bass', 'Stab', 'Arpeggio', 'Pad'];
    case 'synthwave':
      return ['Drums', 'Bass', 'Arpeggio', 'Pad', 'Lead'];
    case 'dance':
    case 'electro':
      return ['Drums', 'Bass', 'Chords', 'Lead', 'FX'];
    default:
      return ['Drums', 'Bass', 'Arpeggio', 'Pad', 'Lead'];
  }
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
    if (style === 'techno') return 'techno_kick';
    return 'four_on_floor';
  }
  if (name.includes('hat')) {
    if (style === 'techno') return 'techno_hats';
    return 'hihat_16ths';
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
  if (name.includes('pad') || name.includes('drone')) return style === 'jarre' ? 'ambient_pad' : 'chords';
  if (name.includes('lead')) return style === 'jarre' ? 'oxygene_lead' : 'melody';
  if (name.includes('fx')) return 'fx_markers';
  return 'chords';
}

export function defaultPatternTypes(layout: string[], style: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const track of layout) {
    result[track] = defaultPatternType(track, style);
  }
  return result;
}

export function styleBpm(style: string): number {
  switch (style) {
    case 'jarre':
      return 108;
    case 'ambient':
      return 90;
    case 'synthwave':
      return 110;
    case 'techno':
      return 130;
    case 'house':
      return 125;
    case 'electro':
      return 128;
    default:
      return 128;
  }
}

export function styleBars(style: string): number {
  return style === 'jarre' || style === 'ambient' ? 32 : 16;
}

export function detectBpm(description: string): number | null {
  const match = description.match(/(\d+)\s*bpm/i);
  return match ? Math.max(60, Math.min(200, parseInt(match[1], 10))) : null;
}

export function detectBars(description: string): number | null {
  const match = description.match(/(\d+)\s*(taktów|takty|bars?|measures?)/i);
  return match ? Math.max(8, Math.min(64, parseInt(match[1], 10))) : null;
}

export function detectKeyScale(description: string): { key: string; scale: 'major' | 'minor' } | null {
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
      const rawScale = match[2]?.toLowerCase() || 'minor';
      const scale = ['major', 'dur'].includes(rawScale) ? 'major' : 'minor';
      return { key, scale };
    }
  }
  return null;
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

export function extractChords(description: string): string[] | null {
  const chordRe = '(?<![A-Za-z])[A-G][#b]?(?:m(?:in)?|maj7?|7|sus4|dim|aug)?(?![A-Za-z])';
  const clusterMatch = description.match(
    new RegExp(`(?:akordy|chords?|progresja|progression)\\s*[:-]?\\s*((?:${chordRe}[,\\s]+){2,}${chordRe})`, 'i')
  );
  if (clusterMatch) {
    return clusterMatch[1].match(new RegExp(chordRe, 'g')) || null;
  }
  const matches = description.match(new RegExp(chordRe, 'g'));
  return matches && matches.length >= 3 ? matches : null;
}

export function buildConfig(
  description: string,
  overrides: Partial<{
    bpm: number;
    bars: number;
    key: string;
    scale: 'major' | 'minor';
    style: string;
  }>
): {
  bpm: number;
  bars: number;
  key: string;
  scale: 'major' | 'minor';
  style: string;
  chordProgression: string[];
  trackLayout: string[];
  patternTypes: Record<string, string>;
} {
  const style = overrides.style || detectStyle(description);
  const bpm = overrides.bpm ?? detectBpm(description) ?? styleBpm(style);
  const bars = overrides.bars ?? detectBars(description) ?? styleBars(style);
  const detected = detectKeyScale(description);
  const key = overrides.key || detected?.key || (style === 'synthwave' ? 'A' : 'D');
  const scale = overrides.scale || detected?.scale || 'minor';
  const explicitChords = extractChords(description);
  const progression = explicitChords
    ? transposeProgression(explicitChords, key, scale)
    : transposeProgression(defaultProgression(scale, style), key, scale);
  const layout = defaultTrackLayout(style);
  const patternTypes = defaultPatternTypes(layout, style);

  return {
    bpm,
    bars,
    key,
    scale,
    style,
    chordProgression: progression,
    trackLayout: layout,
    patternTypes,
  };
}
