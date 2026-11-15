import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderProjectToWav } from '@/lib/audio-export';
import { createProject, createTrack, createRegion } from '@gravsystem/core';

interface CapturedNote {
  time: number;
  note: number | string;
  duration: number;
  velocity: number;
  source: 'melodic' | 'drum';
}

const capturedNotes: CapturedNote[] = [];

vi.mock('tone', async () => {
  const actual = await vi.importActual<typeof import('tone')>('tone');

  function dummyNode() {
    const node: Record<string, unknown> = {
      connect: () => node,
      toDestination: () => node,
      dispose: () => {},
      gain: { value: 1 },
      volume: { value: 0 },
      pan: { value: 0 },
      wet: { value: 0 },
      frequency: { value: 1000 },
      Q: { value: 1 },
      threshold: { value: 0 },
      ratio: { value: 1 },
      decay: 2,
      preDelay: 0.02,
      delayTime: { value: 0.2 },
      feedback: { value: 0.2 },
    };
    return node;
  }

  class DummyPart<T> {
    constructor(
      private callback: (time: number, value: T) => void,
      private events: T[],
    ) {}

    start() {
      for (const event of this.events) {
        const e = event as unknown as { time: number };
        this.callback(e.time, event);
      }
    }

    dispose() {}
  }

  function createDummySynth(source: 'melodic' | 'drum') {
    return class DummySynth {
      connect() {
        return this;
      }
      toDestination() {
        return this;
      }
      dispose() {}
      triggerAttackRelease(
        arg1: number | string,
        arg2: number,
        arg3: number,
        arg4?: number,
      ) {
        // Melodic synths: triggerAttackRelease(note, duration, time, velocity)
        // Drum MembraneSynth: triggerAttackRelease(note, duration, time, velocity)
        // Drum NoiseSynth:    triggerAttackRelease(duration, time, velocity)
        if (source === 'melodic' || typeof arg1 === 'string') {
          capturedNotes.push({
            time: arg3,
            note: arg1,
            duration: arg2,
            velocity: arg4 ?? 1,
            source,
          });
        } else {
          capturedNotes.push({
            time: arg2,
            note: arg1,
            duration: arg1,
            velocity: arg3,
            source,
          });
        }
      }
      start(options?: { note: number | string; time: number; duration: number; velocity: number }) {
        if (options) {
          capturedNotes.push({
            time: options.time,
            note: options.note,
            duration: options.duration,
            velocity: options.velocity / 127,
            source,
          });
        }
      }
    };
  }

  return {
    ...actual,
    Offline: vi.fn(async (fn: (args: { transport: { start: () => void } }) => Promise<void>, duration: number) => {
      capturedNotes.length = 0;
      const fakeTransport = { start: vi.fn() };
      await fn({ transport: fakeTransport });

      const length = Math.ceil(duration * 44100);
      // Produce a non-silent buffer when notes were scheduled.
      const left = new Float32Array(length);
      if (capturedNotes.length > 0) {
        for (let i = 0; i < Math.min(1000, length); i++) {
          left[i] = 0.5 * Math.sin(i * 0.1);
        }
      }
      const right = left.slice();
      return {
        numberOfChannels: 2,
        length,
        sampleRate: 44100,
        duration,
        getChannelData: (channel: number) => (channel === 0 ? left : right),
      } as unknown as import('tone').ToneAudioBuffer;
    }),
    Limiter: class {
      constructor() {
        return dummyNode();
      }
    },
    Compressor: class {
      constructor() {
        return dummyNode();
      }
    },
    EQ3: class {
      constructor() {
        return dummyNode();
      }
    },
    Gain: class {
      constructor() {
        return dummyNode();
      }
    },
    Panner: class {
      constructor() {
        return dummyNode();
      }
    },
    Volume: class {
      constructor() {
        return dummyNode();
      }
    },
    Filter: class {
      constructor() {
        return dummyNode();
      }
    },
    Part: DummyPart as unknown as typeof actual.Part,
    Synth: createDummySynth('melodic'),
    PolySynth: createDummySynth('melodic'),
    MonoSynth: createDummySynth('melodic'),
    DuoSynth: createDummySynth('melodic'),
    FMSynth: createDummySynth('melodic'),
    MembraneSynth: createDummySynth('drum'),
    NoiseSynth: createDummySynth('drum'),
  };
});

function makeSoundTestProject() {
  const project = createProject({ title: 'Sound Test', bpm: 120, bars: 2 });

  const bassTrack = createTrack({ name: 'bass', instrumentType: 'custom' });
  const drumTrack = createTrack({ name: 'drums', instrumentType: 'drums' });

  const bassRegion = createRegion({
    trackId: bassTrack.id,
    duration: 4,
    midiEvents: [
      { pitch: 36, velocity: 100, start: 0, duration: 0.5 },
      { pitch: 40, velocity: 90, start: 1, duration: 0.5 },
      { pitch: 43, velocity: 100, start: 2, duration: 0.5 },
    ],
  });
  const drumRegion = createRegion({
    trackId: drumTrack.id,
    duration: 4,
    midiEvents: [
      { pitch: 36, velocity: 120, start: 0, duration: 0.1 },
      { pitch: 38, velocity: 110, start: 1, duration: 0.1 },
      { pitch: 42, velocity: 80, start: 1.5, duration: 0.1 },
      { pitch: 46, velocity: 90, start: 2, duration: 0.2 },
    ],
  });

  bassTrack.regions.push(bassRegion);
  drumTrack.regions.push(drumRegion);
  project.tracks.push(bassTrack, drumTrack);

  return project;
}

describe('audio-engine sound integration', () => {
  beforeEach(() => {
    capturedNotes.length = 0;
  });

  it('renders a non-silent WAV from a project with melodic and drum tracks', async () => {
    const project = makeSoundTestProject();

    const blob = await renderProjectToWav(project);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBeGreaterThan(44);

    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });

    const view = new DataView(arrayBuffer);
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
    expect(riff).toBe('RIFF');
    expect(wave).toBe('WAVE');

    // The mocked buffer should contain non-zero samples because notes were scheduled.
    const samplesPerChannel = Math.floor((arrayBuffer.byteLength - 44) / 4 / 2);
    const left = new Float32Array(arrayBuffer, 44, samplesPerChannel);
    let maxAbs = 0;
    for (let i = 0; i < left.length; i++) {
      const sample = left[i]!;
      maxAbs = Math.max(maxAbs, Math.abs(sample));
    }
    expect(maxAbs).toBeGreaterThan(0);
  });

  it('schedules the expected melodic and drum note events', async () => {
    const project = makeSoundTestProject();

    await renderProjectToWav(project);

    const melodicNotes = capturedNotes.filter((n) => n.source === 'melodic');
    const drumNotes = capturedNotes.filter((n) => n.source === 'drum');

    expect(melodicNotes.length).toBe(3);
    // Kick and snare each trigger two synth voices, hats trigger one voice each.
    expect(drumNotes.length).toBe(6);

    // Times are in seconds: startBeat + evt.start beats converted at 120 BPM.
    // Bass region starts at beat 0, drum region starts at beat 0.
    expect(melodicNotes.map((n) => n.time).sort((a, b) => a - b)).toEqual([0, 0.5, 1]);
    const uniqueDrumTimes = Array.from(new Set(drumNotes.map((n) => n.time))).sort((a, b) => a - b);
    expect(uniqueDrumTimes).toEqual([0, 0.5, 0.75, 1]);

    // Verify each drum sample family was triggered.
    const drumNoteNames = new Set(drumNotes.map((n) => n.note));
    expect(drumNoteNames).toContain('C1'); // kick body
    expect(drumNoteNames).toContain('D2'); // snare body
    expect(drumNoteNames.size).toBeGreaterThanOrEqual(4);
  });

  it('produces a silent WAV when the project has no notes', async () => {
    const project = createProject({ title: 'Silent Test', bpm: 120, bars: 1 });
    const emptyTrack = createTrack({ name: 'bass' });
    const emptyRegion = createRegion({
      trackId: emptyTrack.id,
      duration: 4,
      midiEvents: [],
    });
    emptyTrack.regions.push(emptyRegion);
    project.tracks.push(emptyTrack);

    const blob = await renderProjectToWav(project);
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });

    const samplesPerChannel = Math.floor((arrayBuffer.byteLength - 44) / 4 / 2);
    const left = new Float32Array(arrayBuffer, 44, samplesPerChannel);
    let maxAbs = 0;
    for (let i = 0; i < left.length; i++) {
      const sample = left[i]!;
      maxAbs = Math.max(maxAbs, Math.abs(sample));
    }
    expect(maxAbs).toBe(0);
  });
});
