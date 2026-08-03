import * as Tone from 'tone';
import { Project } from '@gravsystem/core';
import { SynthDrumKit } from './drum-kit';

interface ScheduledNote {
  time: number;
  note: number;
  duration: number;
  velocity: number;
}

function isDrumTrack(name: string): boolean {
  const lowered = name.toLowerCase();
  return lowered.includes('drum') || lowered.includes('kick') || lowered.includes('hat') || lowered.includes('clap');
}

function createOfflineSynthForTrack(trackName: string): Tone.ToneAudioNode {
  const name = trackName.toLowerCase();

  if (name.includes('bass')) {
    return new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.4,
        release: 0.4,
        baseFrequency: 80,
        octaves: 2.5,
        exponent: 2,
      },
      filter: { Q: 2, type: 'lowpass', rolloff: -24 },
    });
  }

  if (name.includes('lead')) {
    return new Tone.DuoSynth({
      vibratoAmount: 0.1,
      vibratoRate: 5,
      harmonicity: 1.5,
      voice0: {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.5 },
        filterEnvelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.5, baseFrequency: 400, octaves: 2 },
      },
      voice1: {
        oscillator: { type: 'square' },
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.5 },
        filterEnvelope: { attack: 0.05, decay: 0.1, sustain: 0.7, release: 0.5, baseFrequency: 400, octaves: 2 },
      },
    });
  }

  if (name.includes('pad') || name.includes('string') || name.includes('drone')) {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.3, decay: 0.2, sustain: 0.8, release: 1.2 },
    });
  }

  if (name.includes('arpeggio')) {
    return new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.3 },
    });
  }

  if (name.includes('chords') || name.includes('stab')) {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.4 },
    });
  }

  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.5 },
  });
}



interface ReadableAudioBuffer {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  getChannelData(channel: number): Float32Array;
}

function bufferToWav(buffer: ReadableAudioBuffer): Blob {
  const numOfChannels = buffer.numberOfChannels;
  const length = buffer.length * numOfChannels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);
  const channels: Float32Array[] = [];
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF chunk descriptor
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // fmt sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // sub-chunk length (16 for PCM)
  setUint16(1); // PCM
  setUint16(numOfChannels);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChannels); // byte rate
  setUint16(numOfChannels * 2); // block align
  setUint16(16); // bits per sample

  // data sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(buffer.length * numOfChannels * 2); // data chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChannels; i++) {
      let sample = channels[i][offset];
      sample = Math.max(-1, Math.min(1, sample));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export async function renderProjectToWav(project: Project): Promise<Blob> {
  const duration = project.bars * 4 * (60 / project.bpm);

  const rendered = await Tone.Offline(async ({ transport }) => {
    const limiter = new Tone.Limiter(-0.5).toDestination();
    const compressor = new Tone.Compressor(-20, 3.5).connect(limiter);
    const eq = new Tone.EQ3({
      low: -2,
      mid: 1.5,
      high: -1,
      lowFrequency: 250,
      highFrequency: 4000,
    }).connect(compressor);

    const drums = new SynthDrumKit();

    for (const track of project.tracks) {
      const notes: ScheduledNote[] = track.regions.flatMap((region) =>
        region.midiEvents.map((evt) => ({
          time: (evt.start / project.bpm) * 60,
          note: evt.pitch,
          duration: Math.max(0.01, (evt.duration / project.bpm) * 60),
          velocity: evt.velocity / 127,
        }))
      );

      if (notes.length === 0) continue;

      const gain = new Tone.Gain(track.volume ?? 1).connect(eq);
      const panner = new Tone.Panner(track.pan ?? 0).connect(gain);

      if (isDrumTrack(track.name)) {
        const part = new Tone.Part<ScheduledNote>((time, value) => {
          drums.trigger(value.note, value.duration, time, value.velocity);
        }, notes);
        part.start(0);
      } else {
        const synth = createOfflineSynthForTrack(track.name);
        synth.connect(panner);

        const part = new Tone.Part<ScheduledNote>((time, value) => {
          const vel = Math.max(0, Math.min(1, value.velocity));
          if (synth instanceof Tone.PolySynth || synth instanceof Tone.MonoSynth || synth instanceof Tone.DuoSynth || synth instanceof Tone.FMSynth) {
            synth.triggerAttackRelease(value.note, value.duration, time, vel);
          }
        }, notes);
        part.start(0);
      }
    }

    transport.start(0);
  }, duration);

  return bufferToWav(rendered);
}

export function downloadWav(blob: Blob, filename?: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `gravsystem-render-${new Date().toISOString().slice(0, 10)}.wav`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
