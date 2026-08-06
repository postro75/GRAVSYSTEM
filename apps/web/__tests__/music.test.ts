import { describe, it, expect } from 'vitest';
import {
  parseChord,
  scaleNotes,
  isInScale,
  diatonicChords,
  defaultProgression,
  styleBpm,
  styleBars,
  detectBpm,
  detectBars,
  detectKeyScale,
  detectStyle,
  detectDensity,
  buildConfig,
} from '@/lib/music-theory';

describe('music theory', () => {
  it('parses chord names to MIDI notes', () => {
    const c = parseChord('C');
    expect(c.root).toBe(0);
    expect(c.notes).toEqual([60, 64, 67]);

    const am = parseChord('Am');
    expect(am.root).toBe(9);
    expect(am.notes).toContain(69);
  });

  it('builds scale notes', () => {
    const dMinor = scaleNotes('D', 'minor', 4);
    expect(dMinor).toEqual([62, 64, 65, 67, 69, 70, 72]);
  });

  it('checks whether a pitch belongs to a scale across octaves', () => {
    // C major: C, D, E, F, G, A, B
    expect(isInScale(60, 'C', 'major')).toBe(true); // C4
    expect(isInScale(64, 'C', 'major')).toBe(true); // E4
    expect(isInScale(61, 'C', 'major')).toBe(false); // C#4
    expect(isInScale(72, 'C', 'major')).toBe(true); // C5
    expect(isInScale(48, 'C', 'major')).toBe(true); // C3

    // A minor: A, B, C, D, E, F, G
    expect(isInScale(69, 'A', 'minor')).toBe(true); // A4
    expect(isInScale(71, 'A', 'minor')).toBe(true); // B4
    expect(isInScale(70, 'A', 'minor')).toBe(false); // A#4 / Bb4
    expect(isInScale(68, 'A', 'minor')).toBe(false); // G#4
  });

  it('builds diatonic chords', () => {
    const cMajor = diatonicChords('C', 'major', 4);
    expect(cMajor).toHaveLength(7);
    expect(cMajor[0].name).toBe('C');
    expect(cMajor[0].notes).toEqual([60, 64, 67]);
    expect(cMajor[3].name).toBe('F');

    const aMinor = diatonicChords('A', 'minor', 4);
    expect(aMinor[0].name).toBe('Am');
    expect(aMinor[0].notes).toEqual([69, 72, 76]);
  });

  it('detects BPM from description', () => {
    expect(detectBpm('128 BPM dance track')).toBe(128);
    expect(detectBpm('slow ambient')).toBeUndefined();
  });

  it('detects bars from description', () => {
    expect(detectBars('16 bars techno')).toBe(16);
    expect(detectBars('32 takty Jarre')).toBe(32);
  });

  it('detects key and scale', () => {
    expect(detectKeyScale('D minor')).toEqual({ key: 'D', scale: 'minor' });
    expect(detectKeyScale('C major')).toEqual({ key: 'C', scale: 'major' });
  });

  it('detects style', () => {
    expect(detectStyle('Jarre ambient')).toBe('jarre');
    expect(detectStyle('Kavinsky synthwave')).toBe('synthwave');
  });

  it('builds config with overrides', () => {
    const seed = 12345;
    const config = buildConfig('Jarre ambient 108 BPM D minor 32 bars', { seed });
    expect(config.bpm).toBe(108);
    expect(config.bars).toBe(32);
    expect(config.key).toBe('D');
    expect(config.scale).toBe('minor');
    expect(config.style).toBe('jarre');
    expect(config.seed).toBe(seed);
    expect(config.chordProgression).toEqual(defaultProgression('minor', 'jarre', seed));
  });

  it('uses style defaults when no overrides', () => {
    const ambient = buildConfig('Ambient space', {});
    expect(ambient.bpm).toBe(styleBpm('ambient'));
    expect(ambient.bars).toBe(styleBars('ambient'));
    expect(ambient.style).toBe('ambient');

    const techno = buildConfig('Techno club', {});
    expect(techno.bpm).toBe(styleBpm('techno'));
    expect(techno.style).toBe('techno');
  });

  it('detects density from description', () => {
    expect(detectDensity('spokojny ambient space')).toBe('sparse');
    expect(detectDensity('busy dense energetic track')).toBe('dense');
    expect(detectDensity('dance track')).toBe('medium');
  });

  it('builds config with density', () => {
    const sparse = buildConfig('spokojny ambient space', {});
    expect(sparse.density).toBe('sparse');
    const dense = buildConfig('busy dense dance', {});
    expect(dense.density).toBe('dense');
  });
});
