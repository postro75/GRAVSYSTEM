import { describe, it, expect } from 'vitest';
import { generateProject } from '@/lib/generator';

describe('generateProject', () => {
  it('generates a dance project offline', () => {
    const project = generateProject({
      description: 'Dance track with drums bass chords lead',
      style: 'dance',
      bpm: 128,
      bars: 16,
      key: 'D',
      scale: 'minor',
    });

    expect(project.bpm).toBe(128);
    expect(project.key).toBe('D');
    expect(project.tracks.length).toBeGreaterThanOrEqual(4);

    const trackNames = project.tracks.map((t) => t.name);
    expect(trackNames).toContain('Drums');
    expect(trackNames).toContain('Bass');

    const drums = project.tracks.find((t) => t.name === 'Drums');
    expect(drums).toBeDefined();
    expect(drums!.regions.length).toBe(1);
    expect(drums!.regions[0].midiEvents.length).toBeGreaterThan(0);
  });

  it('generates a Jarre-style project', () => {
    const project = generateProject({
      description: 'Jarre ambient 108 BPM D minor 32 bars',
      style: 'jarre',
      bpm: 108,
      bars: 32,
      key: 'D',
      scale: 'minor',
    });

    expect(project.style).toBe('jarre');
    expect(project.bars).toBe(32);
    expect(project.tracks.length).toBeGreaterThanOrEqual(6);
  });
});
