import { describe, it, expect } from 'vitest';
import { createTrack, DEFAULT_INSERT_EFFECTS } from '@gravsystem/core';
import { mapInsertEffects } from '@/lib/audio-engine';

describe('insert effects', () => {
  it('creates a track with default insert effects', () => {
    const track = createTrack({ name: 'Bass' });
    expect(track.insertEffects).toEqual(DEFAULT_INSERT_EFFECTS);
  });

  it('maps zero amounts to bypass values', () => {
    const targets = mapInsertEffects({ distortion: 0, chorus: 0, eq: 0.5, compressor: 0 });
    expect(targets.distortion).toBe(0);
    expect(targets.chorusWet).toBe(0);
    expect(targets.eqLow).toBeCloseTo(0);
    expect(targets.eqMid).toBeCloseTo(0);
    expect(targets.eqHigh).toBeCloseTo(0);
    expect(targets.compressorThreshold).toBe(-30);
    expect(targets.compressorRatio).toBe(1);
  });

  it('maps full amounts to processor limits', () => {
    const targets = mapInsertEffects({ distortion: 1, chorus: 1, eq: 1, compressor: 1 });
    expect(targets.distortion).toBeCloseTo(0.8);
    expect(targets.chorusWet).toBeCloseTo(0.6);
    expect(targets.eqLow).toBeCloseTo(6);
    expect(targets.compressorThreshold).toBeCloseTo(0);
    expect(targets.compressorRatio).toBeCloseTo(12);
  });

  it('maps EQ amount below 0.5 to cut and above 0.5 to boost', () => {
    const cut = mapInsertEffects({ distortion: 0, chorus: 0, eq: 0.25, compressor: 0 });
    const boost = mapInsertEffects({ distortion: 0, chorus: 0, eq: 0.75, compressor: 0 });
    expect(cut.eqLow).toBeCloseTo(-3);
    expect(boost.eqMid).toBeCloseTo(3);
  });
});
