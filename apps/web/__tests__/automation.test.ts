import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { createTrack, AutomationPoint } from '@gravsystem/core';
import { interpolateValue } from '@/components/daw/AutomationEditor';

describe('automation', () => {
  it('creates a track with automation points', () => {
    const track = createTrack({
      name: 'Bass',
      automation: [
        { id: crypto.randomUUID(), param: 'cutoff', time: 0, value: 20000 },
        { id: crypto.randomUUID(), param: 'cutoff', time: 8, value: 800 },
      ],
    });
    expect(track.automation).toHaveLength(2);
    expect(track.automation[0].param).toBe('cutoff');
  });

  it('interpolates between two points', () => {
    const points: AutomationPoint[] = [
      { id: '1', param: 'cutoff', time: 0, value: 0 },
      { id: '2', param: 'cutoff', time: 4, value: 100 },
    ];
    expect(interpolateValue(points, 0)).toBe(0);
    expect(interpolateValue(points, 4)).toBe(100);
    expect(interpolateValue(points, 2)).toBe(50);
  });

  it('clamps before first and after last point', () => {
    const points: AutomationPoint[] = [
      { id: '1', param: 'volume', time: 2, value: 0.5 },
      { id: '2', param: 'volume', time: 6, value: 1.2 },
    ];
    expect(interpolateValue(points, 0)).toBe(0.5);
    expect(interpolateValue(points, 10)).toBe(1.2);
  });
});
