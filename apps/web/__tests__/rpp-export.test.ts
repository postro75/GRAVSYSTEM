import { describe, it, expect } from 'vitest';
import { generateProject } from '@/lib/generator';
import { generateRpp } from '@/lib/rpp-export';

describe('generateRpp', () => {
  it('produces a valid REAPER project header', () => {
    const project = generateProject({
      description: 'Dance track with drums bass chords lead',
      style: 'dance',
      bpm: 128,
      bars: 16,
      key: 'D',
      scale: 'minor',
    });

    const rpp = generateRpp(project);
    expect(rpp.startsWith('<REAPER_PROJECT')).toBe(true);
    expect(rpp).toContain(`TEMPO ${project.bpm} 4 4`);
  });

  it('includes one track per project track with MIDI source', () => {
    const project = generateProject({
      description: 'Jarre ambient 108 BPM D minor 32 bars',
      style: 'jarre',
      bpm: 108,
      bars: 32,
      key: 'D',
      scale: 'minor',
    });

    const rpp = generateRpp(project);
    project.tracks.forEach(() => {
      expect(rpp).toContain(`<TRACK `);
      expect(rpp).toContain(`<SOURCE MIDI`);
    });
    expect(rpp).toContain('>');
  });

  it('includes note on/off events', () => {
    const project = generateProject({
      description: 'Techno loop',
      style: 'techno',
      bpm: 130,
      bars: 8,
      key: 'F',
      scale: 'minor',
    });

    const rpp = generateRpp(project);
    expect(rpp).toMatch(/90 [0-9a-f]{2} [0-9a-f]{2}/i); // note on
    expect(rpp).toMatch(/80 [0-9a-f]{2} 00/i); // note off
  });
});
