import { describe, it, expect, vi } from 'vitest';
import { renderProjectToWav } from '@/lib/audio-export';
import { createProject, createTrack, createRegion } from '@gravsystem/core';

vi.mock('tone', async () => {
  const actual = await vi.importActual<typeof import('tone')>('tone');
  return {
    ...actual,
    Offline: vi.fn(async (_fn: unknown, duration: number) => {
      const length = Math.ceil(duration * 44100);
      return {
        numberOfChannels: 2,
        length,
        sampleRate: 44100,
        getChannelData: () => new Float32Array(length),
        duration,
      } as unknown as import('tone').ToneAudioBuffer;
    }),
  };
});

function makeTestProject() {
  const project = createProject({ title: 'Export Test', bpm: 120, bars: 2 });
  const bassTrack = createTrack({ name: 'bass' });
  const drumTrack = createTrack({ name: 'drums' });
  const region = createRegion({
    trackId: bassTrack.id,
    duration: 4,
    midiEvents: [
      { pitch: 36, velocity: 100, start: 0, duration: 0.5 },
      { pitch: 40, velocity: 90, start: 1, duration: 0.5 },
    ],
  });
  const drumRegion = createRegion({
    trackId: drumTrack.id,
    duration: 4,
    midiEvents: [
      { pitch: 36, velocity: 120, start: 0, duration: 0.1 },
      { pitch: 42, velocity: 80, start: 1, duration: 0.1 },
    ],
  });
  bassTrack.regions.push(region);
  drumTrack.regions.push(drumRegion);
  project.tracks.push(bassTrack, drumTrack);
  return project;
}

describe('audio export', () => {
  it('renders a valid stereo WAV blob', async () => {
    const project = makeTestProject();
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
  });
});
