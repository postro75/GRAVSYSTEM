import { describe, it, expect } from 'vitest';
import { sidechainCurve } from '@/lib/audio-engine';

describe('audio-engine', () => {
  it('returns style-aware sidechain curves', () => {
    expect(sidechainCurve('techno').floor).toBeLessThan(sidechainCurve('house').floor);
    expect(sidechainCurve('ambient').release).toBeGreaterThan(sidechainCurve('dance').release);
  });
});
