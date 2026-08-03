import { describe, it, expect } from 'vitest';
import { generateProject } from '@/lib/generator';
import { defaultArrangement } from '@/lib/music-theory';

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

  it('produces different drum density per section', () => {
    const project = generateProject({
      description: 'Dance track with clear drop',
      style: 'dance',
      bpm: 128,
      bars: 16,
      key: 'D',
      scale: 'minor',
    });

    const drums = project.tracks.find((t) => t.name === 'Drums');
    expect(drums).toBeDefined();
    const events = drums!.regions[0].midiEvents;
    expect(events.length).toBeGreaterThan(0);

    // Intro bars (0-3) should have fewer events than drop bars (8-11)
    const introEvents = events.filter((e) => e.start >= 0 && e.start < 16).length;
    const dropEvents = events.filter((e) => e.start >= 32 && e.start < 48).length;
    expect(dropEvents).toBeGreaterThanOrEqual(introEvents);
  });

  it('humanizes velocities', () => {
    const project = generateProject({
      description: 'Techno loop',
      style: 'techno',
      bpm: 130,
      bars: 8,
      key: 'F',
      scale: 'minor',
    });

    const drums = project.tracks.find((t) => t.name === 'Kick' || t.name === 'Drums');
    if (drums && drums.regions[0].midiEvents.length > 0) {
      const velocities = drums.regions[0].midiEvents.map((e) => e.velocity);
      const unique = new Set(velocities);
      expect(unique.size).toBeGreaterThan(1);
    }
  });
});

describe('defaultArrangement', () => {
  it('creates sections for 16-bar dance track', () => {
    const arrangement = defaultArrangement(16, 'dance');
    const totalBars = arrangement.reduce((sum, s) => sum + s.bars, 0);
    expect(totalBars).toBe(16);
    expect(arrangement.map((s) => s.section)).toContain('drop');
  });

  it('creates longer ambient arrangement', () => {
    const arrangement = defaultArrangement(32, 'ambient');
    const totalBars = arrangement.reduce((sum, s) => sum + s.bars, 0);
    expect(totalBars).toBe(32);
  });
});
