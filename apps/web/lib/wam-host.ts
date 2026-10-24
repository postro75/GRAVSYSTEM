/**
 * Web Audio Modules (WAM) host for GRAVSYSTEM.
 *
 * Loads bundled WAM instruments (Synth-101, Spectrum: Modal) and exposes a
 * thin wrapper so the Tone.js-based AudioEngine can route MIDI into them
 * and connect their audio output into the normal track channel chain.
 */
import type { WebAudioModule, WamNode } from '@webaudiomodules/sdk';
import type { WamEvent, WamMidiData } from '@webaudiomodules/api';

let initializeWamHost: typeof import('@webaudiomodules/sdk').initializeWamHost | undefined;

export interface WamPluginDescriptor {
  id: string;
  name: string;
  url: string;
  vendor?: string;
  category?: 'lead' | 'pad' | 'keys' | 'bass' | 'fx';
}

export const KNOWN_WAM_PLUGINS: WamPluginDescriptor[] = [
  {
    id: 'synth101',
    name: 'Synth-101',
    url: 'burns-audio-wam/dist/plugins/synth101/index.js',
    vendor: 'Sequencer Party',
    category: 'lead',
  },
  {
    id: 'modal',
    name: 'Spectrum: Modal',
    url: 'burns-audio-wam/dist/plugins/modal/index.js',
    vendor: 'Sequencer Party',
    category: 'pad',
  },
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

export interface WamInstrument {
  /** WAM audio node output; connect this to a track channel. */
  readonly output: WamNode;
  /** Underlying WAM module instance (used for GUI creation). */
  readonly module: WebAudioModule<WamNode>;
  /** Schedule a single MIDI note (note-on + note-off). */
  scheduleNote(pitch: number, time: number, duration: number, velocity?: number): void;
  /** Try to create the plugin's native GUI inside the supplied container. */
  createGui(container: HTMLElement): Promise<Element | undefined>;
  /** Destroy any previously created GUI element. */
  destroyGui(gui: Element): void;
  /** Disconnect the WAM node from any downstream nodes. */
  disconnect(): void;
  /** Release the WAM instance and its audio worklet. */
  dispose(): void;
}

interface HostState {
  groupId: string;
  groupKey: string;
}

const hostStateByContext = new WeakMap<BaseAudioContext, HostState>();

/**
 * Initialize the WAM host once per AudioContext. Safe to call multiple
 * times; subsequent calls return the cached host state.
 */
export async function initWamHost(audioContext: BaseAudioContext): Promise<HostState> {
  if (hostStateByContext.has(audioContext)) {
    return hostStateByContext.get(audioContext)!;
  }
  if (!initializeWamHost) {
    const sdk = await import('@webaudiomodules/sdk');
    initializeWamHost = sdk.initializeWamHost;
  }
  const [groupId, groupKey] = await initializeWamHost(audioContext);
  const state: HostState = { groupId, groupKey };
  hostStateByContext.set(audioContext, state);
  return state;
}

/**
 * Map a short plugin id to the bundled module URL. Only plugins shipped
 * with `burns-audio-wam` are guaranteed to resolve without an external URL.
 */
function resolvePluginUrl(pluginId: string): string | undefined {
  const plugin = KNOWN_WAM_PLUGINS.find((p) => p.id === pluginId);
  if (!plugin) return undefined;
  // Only bundled plugins use a relative path.
  if (plugin.url.startsWith('burns-audio-wam/')) return plugin.url;
  return undefined;
}

/**
 * Load any bundled WAM plugin by id. External plugins (Dexed, OB-Xd) are
 * listed for reference but not yet resolved here.
 */
export async function loadWamPlugin(
  pluginId: string,
  audioContext: BaseAudioContext
): Promise<WamInstrument> {
  const url = resolvePluginUrl(pluginId);
  if (!url) {
    throw new Error(`WAM plugin "${pluginId}" is not bundled or not supported.`);
  }

  // Lazy-load the WAM SDK so that environments without AudioWorklet (Node/jsdom)
  // can still import this module for type information and host utilities.
  if (!initializeWamHost) {
    const sdk = await import('@webaudiomodules/sdk');
    initializeWamHost = sdk.initializeWamHost;
  }
  const host = await initWamHost(audioContext);

  // Dynamic import keeps the WAM bundle out of the static dependency graph.
  const moduleFactory: unknown = await import(/* webpackIgnore: true */ url);
  const WamConstructor: any = (moduleFactory as { default?: any }).default ?? moduleFactory;

  const wam: WebAudioModule<WamNode> = await WamConstructor.createInstance(host.groupId, audioContext);
  const output = wam.audioNode;

  return {
    output,
    module: wam,
    scheduleNote(pitch, time, duration, velocity = 100) {
      const vel = Math.max(0, Math.min(127, Math.round(velocity)));
      const noteOn: WamEvent = {
        type: 'wam-midi',
        time,
        data: { bytes: [0x90, pitch & 0x7f, vel] } as WamMidiData,
      };
      const noteOff: WamEvent = {
        type: 'wam-midi',
        time: time + Math.max(0.01, duration),
        data: { bytes: [0x80, pitch & 0x7f, 0] } as WamMidiData,
      };
      output.scheduleEvents(noteOn, noteOff);
    },
    async createGui(container: HTMLElement) {
      try {
        const gui = await wam.createGui();
        if (!gui) return undefined;
        container.appendChild(gui);
        return gui;
      } catch {
        return undefined;
      }
    },
    destroyGui(gui: HTMLElement) {
      try {
        wam.destroyGui(gui);
      } catch {
        // noop
      }
    },
    disconnect() {
      try {
        output.disconnect();
      } catch {
        // noop
      }
    },
    dispose() {
      try {
        output.destroy();
      } catch {
        // noop
      }
    },
  };
}

/** Convenience loader for the Synth-101 monophonic SH-101 clone. */
export async function loadSynth101(audioContext: BaseAudioContext): Promise<WamInstrument> {
  return loadWamPlugin('synth101', audioContext);
}

/** Convenience loader for the Spectrum: Modal polyphonic physical-modelling synth. */
export async function loadModal(audioContext: BaseAudioContext): Promise<WamInstrument> {
  return loadWamPlugin('modal', audioContext);
}
