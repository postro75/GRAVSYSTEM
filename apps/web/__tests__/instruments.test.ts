import { describe, it, expect } from 'vitest';
import { INSTRUMENTS, inferInstrumentForTrack, createCustomSynth, STYLE_INSTRUMENT_PALETTE } from '@/lib/instruments';

describe('instruments', () => {
  it('has unique instrument ids', () => {
    const ids = INSTRUMENTS.map((inst) => inst.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('infers style-aware instruments from the palette', () => {
    expect(STYLE_INSTRUMENT_PALETTE.jarre.bass).toContain(inferInstrumentForTrack('Bass', 'jarre'));
    expect(STYLE_INSTRUMENT_PALETTE.dance.bass).toContain(inferInstrumentForTrack('Bass', 'dance'));
    expect(STYLE_INSTRUMENT_PALETTE.synthwave.lead).toContain(inferInstrumentForTrack('Lead', 'synthwave'));
    expect(STYLE_INSTRUMENT_PALETTE.dance.drums).toContain(inferInstrumentForTrack('Drums', 'dance'));
    expect(STYLE_INSTRUMENT_PALETTE.ambient.pad).toContain(inferInstrumentForTrack('Pad', 'ambient'));
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
