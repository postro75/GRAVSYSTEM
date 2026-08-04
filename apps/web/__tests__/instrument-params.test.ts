import { describe, it, expect } from 'vitest';
import { DEFAULT_INSTRUMENT_PARAMS } from '@gravsystem/core';
import { clampInstrumentParams, formatParamValue, defaultParamsForStyle } from '@/lib/instrument-params';

describe('instrument params', () => {
  it('has defaults within valid ranges', () => {
    expect(DEFAULT_INSTRUMENT_PARAMS.attack).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_INSTRUMENT_PARAMS.cutoff).toBeGreaterThanOrEqual(20);
    expect(DEFAULT_INSTRUMENT_PARAMS.cutoff).toBeLessThanOrEqual(20000);
    expect(DEFAULT_INSTRUMENT_PARAMS.sustain).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_INSTRUMENT_PARAMS.sustain).toBeLessThanOrEqual(1);
  });

  it('clamps out-of-range values', () => {
    const clamped = clampInstrumentParams({
      attack: -1,
      decay: 10,
      sustain: 2,
      release: -0.5,
      cutoff: 10,
      resonance: 50,
      reverb: -0.2,
      delay: 3,
    });
    expect(clamped.attack).toBe(0);
    expect(clamped.decay).toBe(5);
    expect(clamped.sustain).toBe(1);
    expect(clamped.release).toBe(0);
    expect(clamped.cutoff).toBe(20);
    expect(clamped.resonance).toBe(20);
    expect(clamped.reverb).toBe(0);
    expect(clamped.delay).toBe(1);
  });

  it('fills missing values with defaults', () => {
    const clamped = clampInstrumentParams({ attack: 0.5 });
    expect(clamped.attack).toBe(0.5);
    expect(clamped.decay).toBe(DEFAULT_INSTRUMENT_PARAMS.decay);
  });

  it('formats values for display', () => {
    expect(formatParamValue('attack', 0.05)).toBe('50 ms');
    expect(formatParamValue('cutoff', 20000)).toBe('20.0 kHz');
    expect(formatParamValue('cutoff', 440)).toBe('440 Hz');
    expect(formatParamValue('reverb', 0.35)).toBe('35%');
  });

  it('returns style-specific default params', () => {
    const ambient = defaultParamsForStyle('ambient');
    expect(ambient.attack).toBeGreaterThan(DEFAULT_INSTRUMENT_PARAMS.attack);
    expect(ambient.release).toBeGreaterThan(DEFAULT_INSTRUMENT_PARAMS.release);
    expect(ambient.reverb).toBeGreaterThan(DEFAULT_INSTRUMENT_PARAMS.reverb);

    const techno = defaultParamsForStyle('techno');
    expect(techno.attack).toBeLessThan(DEFAULT_INSTRUMENT_PARAMS.attack);
    expect(techno.cutoff).toBeGreaterThanOrEqual(DEFAULT_INSTRUMENT_PARAMS.cutoff);

    const unknown = defaultParamsForStyle('unknown');
    expect(unknown).toEqual(DEFAULT_INSTRUMENT_PARAMS);
  });
});
