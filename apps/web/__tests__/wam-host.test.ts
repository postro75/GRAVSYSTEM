import { describe, it, expect } from 'vitest';
import { createWamHost, KNOWN_WAM_PLUGINS } from '@/lib/wam-host';

describe('wam-host', () => {
  it('lists known WAM plugins', () => {
    const host = createWamHost();
    const plugins = host.listPlugins();
    expect(plugins.length).toBe(KNOWN_WAM_PLUGINS.length);
    expect(plugins.some((p) => p.id === 'dexed')).toBe(true);
  });

  it('reports AudioWorklet support', () => {
    const host = createWamHost();
    expect(typeof host.isSupported()).toBe('boolean');
  });
});
