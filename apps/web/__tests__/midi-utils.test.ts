import { describe, it, expect } from 'vitest';
import { quantizeValue, gridToBeats } from '@/lib/midi-utils';

describe('midi utils', () => {
  it('returns identity when quantize is off', () => {
    expect(quantizeValue(0.37, 'off')).toBe(0.37);
    expect(quantizeValue(0.01, 'off', 0.05)).toBe(0.05);
    expect(quantizeValue(0.01, 'off')).toBe(0.01);
  });

  it('converts grid names to beats', () => {
    expect(gridToBeats('1/4')).toBe(1);
    expect(gridToBeats('1/8')).toBe(0.5);
    expect(gridToBeats('1/16')).toBe(0.25);
    expect(gridToBeats('off')).toBe(0);
  });

  it('quantizes to 1/16 grid', () => {
    expect(quantizeValue(0.13, '1/16')).toBeCloseTo(0.25);
    expect(quantizeValue(0.37, '1/16')).toBeCloseTo(0.25);
    expect(quantizeValue(0.63, '1/16')).toBeCloseTo(0.75);
  });

  it('quantizes to 1/8 grid', () => {
    expect(quantizeValue(0.1, '1/8')).toBeCloseTo(0);
    expect(quantizeValue(0.3, '1/8')).toBeCloseTo(0.5);
    expect(quantizeValue(0.8, '1/8')).toBeCloseTo(1);
  });

  it('respects a minimum duration', () => {
    expect(quantizeValue(0.01, '1/16', 0.05)).toBe(0.05);
    expect(quantizeValue(0, '1/8', 0.1)).toBe(0.1);
  });
});
