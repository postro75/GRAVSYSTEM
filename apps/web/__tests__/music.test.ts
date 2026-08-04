import { describe, it, expect } from 'vitest';
import {
  parseChord,
  scaleNotes,
  defaultProgression,
  styleBpm,
  styleBars,
  detectBpm,
  detectBars,
  detectKeyScale,
  detectStyle,
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
    const config = buildConfig('Jarre ambient 108 BPM D minor 32 bars', {});
    expect(config.bpm).toBe(108);
    expect(config.bars).toBe(32);
    expect(config.key).toBe('D');
    expect(config.scale).toBe('minor');
    expect(config.style).toBe('jarre');
    expect(config.seed).toBeDefined();
    expect(config.chordProgression).toEqual(defaultProgression('minor', 'jarre', config.seed));
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
});
