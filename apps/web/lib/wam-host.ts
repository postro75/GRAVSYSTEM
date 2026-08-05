/**
 * Web Audio Modules (WAM) host for GRAVSYSTEM.
 *
 * Loads the Burns Audio Synth-101 WAM (Roland SH-101 clone) as a real
 * instrument plugin and exposes a thin wrapper so the Tone.js-based
 * AudioEngine can route MIDI into it and connect its audio output into
 * the normal track channel chain.
 */
import type { WebAudioModule, WamNode } from '@webaudiomodules/sdk';
import type { WamEvent, WamMidiData } from '@webaudiomodules/api';

let initializeWamHost: typeof import('@webaudiomodules/sdk').initializeWamHost | undefined;

export interface WamPluginDescriptor {
  id: string;
  name: string;
  url: string;
  vendor?: string;
}

export const KNOWN_WAM_PLUGINS: WamPluginDescriptor[] = [
  {
    id: 'synth101',
    name: 'Synth-101',
    url: 'burns-audio-wam/dist/plugins/synth101/index.js',
    vendor: 'Sequencer Party',
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
  /** Schedule a single MIDI note (note-on + note-off). */
  scheduleNote(pitch: number, time: number, duration: number, velocity?: number): void;
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
 * Load the Synth-101 WAM plugin into the supplied AudioContext.
 *
 * The plugin is loaded via dynamic import so that bundlers do not try to
 * statically analyze the WAM entry point (it is an ESM bundle that expects
 * to be served from its own directory).
 */
export async function loadSynth101(audioContext: BaseAudioContext): Promise<WamInstrument> {
  // Lazy-load the WAM SDK so that environments without AudioWorklet (Node/jsdom)
  // can still import this module for type information and host utilities.
  if (!initializeWamHost) {
    const sdk = await import('@webaudiomodules/sdk');
    initializeWamHost = sdk.initializeWamHost;
  }
  const host = await initWamHost(audioContext);

  // Dynamic import keeps the WAM bundle out of the static dependency graph.
  const moduleFactory: unknown = await import('burns-audio-wam/dist/plugins/synth101/index.js');
  const WamConstructor: any = (moduleFactory as { default?: any }).default ?? moduleFactory;

  const wam: WebAudioModule<WamNode> = await WamConstructor.createInstance(host.groupId, audioContext);
  const output = wam.audioNode;

  return {
    output,
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
