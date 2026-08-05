/**
 * Web Audio Modules (WAM) host prototype.
 *
 * This file is a thin research scaffold. The current GRAVSYSTEM audio engine
 * is built on Tone.js and sounds good enough for the browser prototype, so
 * WAM integration is behind a feature flag and not wired into playback yet.
 *
 * Next steps for Phase 16:
 * 1. Install @webaudiomodules/sdk and @webaudiomodules/api when they stabilise.
 * 2. Load a WAM plugin (e.g. Dexed, OB-Xd web build) as an AudioWorklet.
 * 3. Route generated MIDI events into the plugin and its audio output into the
 *    track channel chain in AudioEngine.
 * 4. Persist the selected WAM plugin per track in the project model.
 */

export interface WamPluginDescriptor {
  id: string;
  name: string;
  url: string;
  vendor?: string;
}

export const KNOWN_WAM_PLUGINS: WamPluginDescriptor[] = [
  {
    id: 'dexed',
    name: 'Dexed',
    url: 'https://github.com/asb2m10/dexed',
    vendor: 'asb2m10',
  },
  {
    id: 'ob-xd-web',
    name: 'OB-Xd Web',
    url: 'https://github.com/reales/OB-Xd',
    vendor: 'reales',
  },
  {
    id: 'vital-web',
    name: 'Vital',
    url: 'https://vital.audio/',
    vendor: 'Vital Audio',
  },
];

export interface WamHost {
  /** Returns true if the environment can run AudioWorklet-based WAM plugins. */
  isSupported(): boolean;
  /** Lists plugins known to work (or intended to work) in the browser. */
  listPlugins(): WamPluginDescriptor[];
}

export function createWamHost(): WamHost {
  return {
    isSupported() {
      return typeof window !== 'undefined' && 'AudioWorklet' in window;
    },
    listPlugins() {
      return KNOWN_WAM_PLUGINS;
    },
  };
}
