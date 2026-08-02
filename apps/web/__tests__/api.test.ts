import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as generatePost } from '@/app/api/generate/route';
import { POST as waveformPost } from '@/app/api/waveform/route';

describe('API routes', () => {
  it('generates a REAPER project', async () => {
    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Jarre ambient 108 BPM D minor 32 bars',
        style: 'jarre',
        bpm: 108,
        bars: 32,
        key: 'D',
        scale: 'minor',
        outputType: 'rpp',
        addFx: false,
      }),
    });
    const res = await generatePost(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.project.files.some((f: { type: string }) => f.type === 'rpp')).toBe(true);
  });

  it('generates a MIDI file', async () => {
    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'Dance track',
        style: 'dance',
        bpm: 128,
        bars: 16,
        key: 'D',
        scale: 'minor',
        outputType: 'mid',
        addFx: false,
      }),
    });
    const res = await generatePost(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.project.files.some((f: { type: string }) => f.type === 'mid')).toBe(true);
  });

  it('generates a waveform preview', async () => {
    const req = new NextRequest('http://localhost/api/waveform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config: {
          bpm: 120,
          bars: 8,
          key: 'C',
          scale: 'major',
          style: 'dance',
          chordProgression: ['C', 'G', 'Am', 'F'],
          trackLayout: ['Drums', 'Bass', 'Arpeggio', 'Pad', 'Lead'],
          patternTypes: {},
          description: 'test',
        },
      }),
    });
    const res = await waveformPost(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(typeof data.wav).toBe('string');
    expect(data.wav.length).toBeGreaterThan(100);
  });
});
