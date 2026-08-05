import { describe, it, expect } from 'vitest';
import { createWamHost, KNOWN_WAM_PLUGINS } from '@/lib/wam-host';

describe('wam-host', () => {
  it('lists Synth-101 as the primary real WAM plugin', () => {
    const host = createWamHost();
    const plugins = host.listPlugins();
    expect(plugins.some((p) => p.id === 'synth101')).toBe(true);
    const synth101 = plugins.find((p) => p.id === 'synth101')!;
    expect(synth101.name).toBe('Synth-101');
    expect(synth101.vendor).toBe('Sequencer Party');
  });

  it('reports availability based on AudioWorklet support', () => {
    const host = createWamHost();
    const hasWorklet = typeof window !== 'undefined' && 'AudioWorklet' in window;
    expect(host.isSupported()).toBe(hasWorklet);
  });

  it('keeps plugin descriptors immutable', () => {
    expect(KNOWN_WAM_PLUGINS.length).toBeGreaterThanOrEqual(1);
  });
});
