import { describe, it, expect } from 'vitest';
import { INSTRUMENTS, inferInstrumentForTrack, createCustomSynth } from '@/lib/instruments';

describe('instruments', () => {
  it('has unique instrument ids', () => {
    const ids = INSTRUMENTS.map((inst) => inst.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('infers instruments by track name and style', () => {
    expect(inferInstrumentForTrack('Bass', 'jarre')).toBe('jarre-bass');
    expect(inferInstrumentForTrack('Bass', 'dance')).toBe('dance-bass');
    expect(inferInstrumentForTrack('Lead', 'synthwave')).toBe('synthwave-lead');
    expect(inferInstrumentForTrack('Drums', 'dance')).toBe('synth-drums');
    expect(inferInstrumentForTrack('Pad', 'ambient')).toBe('warm-pad');
  });

  it('creates a custom synth for every custom instrument id', () => {
    // Tone.js requires a real Web Audio API; jsdom's polyfill cannot instantiate synths.
    if (typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom')) {
      return;
    }
    const customIds = INSTRUMENTS.filter((inst) => inst.type === 'custom').map((inst) => inst.id);
    for (const id of customIds) {
      const synth = createCustomSynth(id);
      expect(synth).toBeDefined();
      synth.dispose();
    }
  });
});
