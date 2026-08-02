import { MusicConfig } from './types';
import { generateMidiEvents } from './midi';

const SAMPLE_RATE = 44100;
const BEATS_PER_BAR = 4;

interface Envelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

interface Voice {
  freq: number;
  velocity: number;
  startTime: number;
  releaseTime: number;
  type: 'kick' | 'snare' | 'hihat' | 'clap' | 'sine' | 'saw' | 'square' | 'triangle' | 'noise';
  envelope: Envelope;
  filterCutoff: number;
  filterEnv: number;
  filterQ: number;
  filterType: 'lp' | 'hp' | 'bp' | 'none';
  pan: number;
  gain: number;
  reverbSend: number;
  delaySend: number;
  pitchEnv?: number; // for kick sweep
}

function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// White noise with seed
let noiseSeed = 12345;
function whiteNoise(): number {
  noiseSeed = (noiseSeed * 1664525 + 1013904223) >>> 0;
  return (noiseSeed / 4294967296) * 2 - 1;
}

function getDrumSound(note: number): Voice['type'] {
  if (note === 36) return 'kick';
  if (note === 38 || note === 39) return note === 39 ? 'clap' : 'snare';
  if (note === 42 || note === 44) return 'hihat';
  if (note === 46) return 'hihat';
  return 'kick';
}

function envelopeValue(age: number, rel: number, env: Envelope): number {
  if (age < env.attack) {
    return age / env.attack;
  }
  const decayPos = age - env.attack;
  if (decayPos < env.decay) {
    return 1 - (1 - env.sustain) * (decayPos / env.decay);
  }
  if (rel > 0) {
    return Math.max(0, env.sustain * (1 - rel / env.release));
  }
  return env.sustain;
}

function voiceTypeForTrack(trackName: string, style: string): Voice['type'] {
  const name = trackName.toLowerCase();
  if (name.includes('drum') || name.includes('kick') || name.includes('hat')) return 'noise';
  if (name.includes('bass')) {
    if (style === 'jarre') return 'saw';
    if (style === 'synthwave') return 'saw';
    return 'saw';
  }
  if (name.includes('pad') || name.includes('drone') || name.includes('string')) return 'saw';
  if (name.includes('arpeggio')) return style === 'jarre' ? 'triangle' : 'saw';
  if (name.includes('chords') || name.includes('stab')) return 'saw';
  if (name.includes('lead')) return style === 'jarre' ? 'sine' : 'square';
  if (name.includes('fx')) return 'noise';
  return 'saw';
}

function makeDrumVoice(note: number, velocity: number, start: number, duration: number): Voice {
  const sound = getDrumSound(note);
  const gain = velocity / 127;

  if (sound === 'kick') {
    return {
      freq: 50,
      velocity,
      startTime: start,
      releaseTime: start + Math.min(duration, 0.5),
      type: 'kick',
      envelope: { attack: 0.002, decay: 0.35, sustain: 0, release: 0.15 },
      filterCutoff: 0.5,
      filterEnv: 0,
      filterQ: 0,
      filterType: 'none',
      pan: 0,
      gain: gain * 1.15,
      reverbSend: 0.1,
      delaySend: 0,
      pitchEnv: 100, // Hz drop from
    };
  }

  if (sound === 'snare') {
    return {
      freq: 180,
      velocity,
      startTime: start,
      releaseTime: start + Math.min(duration, 0.3),
      type: 'snare',
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.12 },
      filterCutoff: 0.55,
      filterEnv: 0,
      filterQ: 0.25,
      filterType: 'bp',
      pan: 0.05,
      gain: gain * 0.9,
      reverbSend: 0.25,
      delaySend: 0,
    };
  }

  if (sound === 'hihat') {
    return {
      freq: 9000,
      velocity,
      startTime: start,
      releaseTime: start + Math.min(duration, 0.06),
      type: 'hihat',
      envelope: { attack: 0.0005, decay: 0.035, sustain: 0, release: 0.02 },
      filterCutoff: 0.85,
      filterEnv: 0,
      filterQ: 0.1,
      filterType: 'hp',
      pan: note === 42 ? -0.15 : 0.15,
      gain: gain * 0.55,
      reverbSend: 0.08,
      delaySend: 0,
    };
  }

  // clap
  return {
    freq: 1500,
    velocity,
    startTime: start,
    releaseTime: start + Math.min(duration, 0.22),
    type: 'clap',
    envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.07 },
    filterCutoff: 0.65,
    filterEnv: 0,
    filterQ: 0.15,
    filterType: 'bp',
    pan: 0.1,
    gain: gain * 0.8,
    reverbSend: 0.3,
    delaySend: 0,
  };
}

function makeInstrumentVoice(
  trackName: string,
  style: string,
  note: number,
  velocity: number,
  start: number,
  duration: number
): Voice {
  const type = voiceTypeForTrack(trackName, style);
  const baseFreq = midiToFreq(note);
  const name = trackName.toLowerCase();
  const velGain = velocity / 127;

  let envelope: Envelope = { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.2 };
  let filterCutoff = 0.5;
  let filterEnv = 0;
  let filterQ = 0.2;
  let filterType: Voice['filterType'] = 'lp';
  let gain = velGain;
  let reverbSend = 0.2;
  let delaySend = 0.1;
  let pan = 0;

  if (name.includes('bass')) {
    envelope = { attack: 0.01, decay: 0.15, sustain: 0.8, release: 0.15 };
    filterCutoff = 0.35;
    filterEnv = 0.2;
    filterQ = 0.4;
    gain = velGain * 0.9;
    reverbSend = 0.05;
    delaySend = 0;
    pan = 0;
  } else if (name.includes('pad') || name.includes('drone') || name.includes('string')) {
    envelope = { attack: 0.3, decay: 0.2, sustain: 0.85, release: 0.6 };
    filterCutoff = 0.3;
    filterEnv = 0;
    filterQ = 0.3;
    gain = velGain * 0.65;
    reverbSend = 0.45;
    delaySend = 0.15;
    pan = name.includes('string') ? -0.2 : 0.2;
  } else if (name.includes('arpeggio')) {
    envelope = { attack: 0.005, decay: 0.2, sustain: 0.2, release: 0.15 };
    filterCutoff = style === 'jarre' ? 0.25 : 0.55;
    filterEnv = style === 'jarre' ? 0 : 0.15;
    filterQ = 0.2;
    gain = velGain * 0.55;
    reverbSend = 0.25;
    delaySend = 0.2;
    pan = name.includes('1') ? -0.1 : 0.1;
  } else if (name.includes('chords') || name.includes('stab')) {
    envelope = { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.25 };
    filterCutoff = 0.5;
    filterEnv = 0.2;
    filterQ = 0.2;
    gain = velGain * 0.6;
    reverbSend = 0.25;
    delaySend = 0.1;
    pan = 0;
  } else if (name.includes('lead')) {
    envelope = { attack: 0.08, decay: 0.15, sustain: 0.85, release: 0.4 };
    filterCutoff = 0.45;
    filterEnv = 0.1;
    filterQ = 0.1;
    gain = velGain * 0.7;
    reverbSend = 0.3;
    delaySend = 0.2;
    pan = 0;
  } else if (name.includes('fx')) {
    envelope = { attack: 0.1, decay: 0.5, sustain: 0, release: 0.5 };
    filterCutoff = 0.6;
    filterEnv = 0.3;
    filterQ = 0.5;
    filterType = 'bp';
    gain = velGain * 0.4;
    reverbSend = 0.6;
    delaySend = 0.3;
    pan = 0;
  }

  return {
    freq: baseFreq,
    velocity,
    startTime: start,
    releaseTime: start + duration,
    type,
    envelope,
    filterCutoff,
    filterEnv,
    filterQ,
    filterType,
    pan,
    gain,
    reverbSend,
    delaySend,
  };
}

function renderOscillator(t: number, freq: number, type: Voice['type']): number {
  switch (type) {
    case 'sine':
      return Math.sin(2 * Math.PI * freq * t);
    case 'saw': {
      const phase = (freq * t) % 1;
      return 2 * phase - 1;
    }
    case 'square': {
      return Math.sin(2 * Math.PI * freq * t) >= 0 ? 0.6 : -0.6;
    }
    case 'triangle': {
      const phase = (freq * t) % 1;
      return phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
    }
    case 'noise':
    case 'snare':
    case 'hihat':
    case 'clap':
      return Math.random() * 2 - 1;
    default:
      return 0;
  }
}

function renderDrum(age: number, rel: number, voice: Voice): number {
  const amp = envelopeValue(age, rel, voice.envelope);

  if (voice.type === 'kick') {
    // Exponential pitch sweep from high to low
    const sweep = Math.exp(-age * 18);
    const startFreq = voice.freq + (voice.pitchEnv || 80);
    const endFreq = voice.freq;
    const currentFreq = endFreq + (startFreq - endFreq) * sweep;
    const body = Math.sin(2 * Math.PI * currentFreq * age);
    // Click at very start
    const click = age < 0.005 ? whiteNoise() * (1 - age / 0.005) * 0.6 : 0;
    return (body * 0.9 + click * 0.4) * amp;
  }

  if (voice.type === 'snare') {
    const tone = Math.sin(2 * Math.PI * voice.freq * age) * 0.45;
    const snap = Math.sin(2 * Math.PI * voice.freq * 2.5 * age) * 0.15;
    const noise = whiteNoise();
    // Bandpass-ish noise by combining highpass and lowpass simple weights
    const lastNoise = whiteNoise();
    const diff = noise - lastNoise;
    const bodyNoise = noise * 0.35 + diff * 0.45;
    return (tone + snap + bodyNoise) * amp;
  }

  if (voice.type === 'hihat') {
    // Metallic hi-hat: squared noise + high emphasis
    const n1 = whiteNoise();
    const n2 = whiteNoise();
    const metallic = (n1 * n1 - n2 * n2) * 0.5;
    const highNoise = (n1 - n2) * 0.5;
    return (metallic * 0.3 + highNoise * 0.7) * amp * 0.9;
  }

  if (voice.type === 'clap') {
    // 3 short bursts
    const burst1 = age > 0.000 && age < 0.015 ? 1 : 0;
    const burst2 = age > 0.012 && age < 0.027 ? 1 : 0;
    const burst3 = age > 0.024 && age < 0.050 ? 1 : 0;
    const burst = (burst1 + burst2 + burst3) / 3;
    return whiteNoise() * burst * amp * 1.2;
  }

  return 0;
}

export function generateWav(config: MusicConfig): string {
  const secondsPerBeat = 60 / config.bpm;
  const totalSeconds = config.bars * BEATS_PER_BAR * secondsPerBeat;
  const totalSamples = Math.floor(totalSeconds * SAMPLE_RATE);

  const eventsByTrack = generateMidiEvents(config);
  const voices: Voice[] = [];
  const isDrumTrack = (name: string) =>
    name.toLowerCase().includes('drum') || name.toLowerCase().includes('kick') || name.toLowerCase().includes('hat');

  for (const [trackName, events] of eventsByTrack) {
    const ticksPerBeat = 480;
    const secondsPerTick = secondsPerBeat / ticksPerBeat;
    const drums = isDrumTrack(trackName);

    for (const evt of events) {
      const start = evt.time * secondsPerTick;
      const duration = Math.min(evt.duration * secondsPerTick, 4.0);
      if (drums) {
        voices.push(makeDrumVoice(evt.note, evt.velocity, start, duration));
      } else {
        voices.push(makeInstrumentVoice(trackName, config.style, evt.note, evt.velocity, start, duration));
      }
    }
  }

  // Separate dry/wet buffers
  const dry = new Float32Array(totalSamples);
  const reverbBus = new Float32Array(totalSamples);
  const delayBus = new Float32Array(totalSamples);

  for (const voice of voices) {
    const startSample = Math.max(0, Math.floor(voice.startTime * SAMPLE_RATE));
    const endSample = Math.min(totalSamples, Math.floor((voice.releaseTime + voice.envelope.release + 0.5) * SAMPLE_RATE));

    // Per-voice filter instances (simple one-pole stateless approx handled in renderVoice is expensive to recreate).
    // For performance we render without continuous filter state in renderVoice for non-drums.
    // Instead do a pre-rendered sample approach: render each voice sample by sample with local filter state.

    let lpZ = 0;
    let hpX = 0;
    let hpY = 0;

    for (let i = startSample; i < endSample; i++) {
      const t = i / SAMPLE_RATE;
      const age = t - voice.startTime;
      if (age < 0) continue;
      const rel = Math.max(0, t - voice.releaseTime);

      let sample: number;
      if (['kick', 'snare', 'hihat', 'clap'].includes(voice.type)) {
        sample = renderDrum(age, rel, voice);
      } else {
        sample = renderOscillator(t, voice.freq, voice.type);
        if (voice.type === 'saw' || voice.type === 'square') {
          sample += renderOscillator(t, voice.freq * 1.003, voice.type) * 0.3;
          sample *= 0.77;
        }

        const envAmp = envelopeValue(age, rel, voice.envelope);
        const filterMod = 1 + voice.filterEnv * (1 - envAmp);
        const cutoff = clamp(voice.filterCutoff * filterMod, 0.01, 0.99);

        if (voice.filterType === 'lp') {
          lpZ += cutoff * (sample - lpZ);
          sample = lpZ;
        } else if (voice.filterType === 'hp') {
          const c = clamp(cutoff, 0.001, 0.99);
          hpY = c * (hpY + sample - hpX);
          hpX = sample;
          sample = hpY;
        } else if (voice.filterType === 'bp') {
          const c = clamp(cutoff, 0.001, 0.99);
          lpZ += c * (sample - lpZ);
          hpY = c * (hpY + lpZ - hpX);
          hpX = lpZ;
          sample = hpY;
        }

        sample *= envAmp;
      }

      sample *= voice.gain;

      const left = sample * (1 - voice.pan) * 0.5;
      const right = sample * (1 + voice.pan) * 0.5;
      const mono = (left + right) * 0.7; // reduce to avoid clipping when many voices

      dry[i] += mono;

      if (voice.reverbSend > 0) {
        reverbBus[i] += mono * voice.reverbSend;
      }
      if (voice.delaySend > 0) {
        delayBus[i] += mono * voice.delaySend;
      }
    }
  }

  // Simple multitap reverb
  const reverbWet = new Float32Array(totalSamples);
  const reverbTaps = [0.03, 0.05, 0.07, 0.11, 0.13, 0.17];
  const reverbGains = [0.5, 0.35, 0.25, 0.18, 0.12, 0.08];
  for (let i = 0; i < totalSamples; i++) {
    let sum = 0;
    for (let t = 0; t < reverbTaps.length; t++) {
      const delaySamples = Math.floor(reverbTaps[t] * SAMPLE_RATE);
      if (i >= delaySamples) {
        sum += reverbBus[i - delaySamples] * reverbGains[t];
      }
    }
    reverbWet[i] = sum;
  }

  // Simple delay
  const delayWet = new Float32Array(totalSamples);
  const delayTime = Math.floor(0.375 * SAMPLE_RATE); // dotted 8th approx
  const feedback = 0.35;
  for (let i = 0; i < totalSamples; i++) {
    const prev = i >= delayTime ? delayWet[i - delayTime] : 0;
    delayWet[i] = delayBus[i] + prev * feedback;
  }

  // Mix
  const mix = new Float32Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    mix[i] = dry[i] + reverbWet[i] * 0.4 + delayWet[i] * 0.25;
  }

  // Soft limiting
  const limit = 0.95;
  for (let i = 0; i < totalSamples; i++) {
    mix[i] = Math.tanh(mix[i] / limit) * limit;
  }

  // Convert to 16-bit PCM
  const pcm = new Int16Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    pcm[i] = Math.max(-32768, Math.min(32767, Math.round(mix[i] * 32767)));
  }

  // WAV header
  const dataLength = pcm.length * 2;
  const headerLength = 44;
  const wav = new Uint8Array(headerLength + dataLength);
  const view = new DataView(wav.buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  for (let i = 0; i < pcm.length; i++) {
    view.setInt16(44 + i * 2, pcm[i], true);
  }

  let binary = '';
  for (let i = 0; i < wav.length; i++) {
    binary += String.fromCharCode(wav[i]);
  }
  return btoa(binary);
}
