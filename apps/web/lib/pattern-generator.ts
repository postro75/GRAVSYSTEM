import { parseChord, scaleNotes, ParsedChord, GenerationConfig, Scale } from './music-theory';
import { MidiEvent } from '@gravsystem/core';

export const TICKS_PER_BEAT = 480;
const BEATS_PER_BAR = 4;
const BAR_TICKS = BEATS_PER_BAR * TICKS_PER_BEAT;

interface RawEvent {
  time: number; // ticks
  duration: number; // ticks
  note: number;
  velocity: number;
}

function clampVelocity(v: number): number {
  return Math.max(1, Math.min(127, Math.round(v)));
}

function mulberry32(seed: number): () => number {
  let t = seed + 0x6d2b79f5;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1) | 0;
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61) | 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DRUM_NOTES = {
  kick: 36,
  snare: 38,
  clap: 39,
  hihatClosed: 42,
  hihatOpen: 46,
  crash: 49,
};

export function generateDrumPattern(
  patternType: string,
  barTicks: number,
  style: string,
  barIndex: number
): RawEvent[] {
  const events: RawEvent[] = [];
  const stepTicks = barTicks / 16;
  const rng = mulberry32(barIndex * 12345 + patternType.length);
  const isFill = barIndex > 0 && barIndex % 4 === 3;

  function add(step: number, note: number, velocity: number, durationFactor = 1.0): void {
    events.push({
      time: step * stepTicks,
      duration: Math.max(1, stepTicks * durationFactor),
      note,
      velocity: clampVelocity(velocity),
    });
  }

  for (let step = 0; step < 16; step++) {
    const isKickStep = step % 4 === 0;
    const isBackbeat = step % 8 === 4;
    const isOffbeat = step % 4 === 2;

    if (patternType === 'four_on_floor' || patternType === 'techno_kick') {
      if (isKickStep) {
        const vel = patternType === 'techno_kick' ? 120 : 110;
        add(step, DRUM_NOTES.kick, vel + (isFill ? rng() * 10 : 0), 0.6);
      }
      if (patternType === 'four_on_floor') {
        if (isOffbeat) add(step, DRUM_NOTES.hihatClosed, 70 + rng() * 15, 0.3);
        if (isBackbeat) add(step, DRUM_NOTES.clap, 100, 0.5);
        if (isFill && step > 10 && step % 2 === 0) {
          add(step, DRUM_NOTES.snare, 90 + rng() * 20, 0.4);
        }
      }
    } else if (patternType === 'techno_hats') {
      const vel = step % 2 === 0 ? 60 + rng() * 10 : 45 + rng() * 10;
      add(step, DRUM_NOTES.hihatClosed, vel, 0.2);
      if (isOffbeat) add(step, DRUM_NOTES.hihatOpen, 75 + rng() * 10, 0.3);
    } else if (patternType === 'techno_drive') {
      if (isKickStep) add(step, DRUM_NOTES.kick, 120, 0.5);
      add(step, DRUM_NOTES.hihatClosed, step % 2 === 0 ? 65 : 50, 0.2);
      if (isBackbeat) add(step, DRUM_NOTES.snare, 105 + rng() * 10, 0.4);
    } else if (patternType === 'electronic_sparse') {
      if (step % 8 === 0) add(step, DRUM_NOTES.kick, 90, 0.8);
      if (step % 8 === 4) add(step, DRUM_NOTES.snare, 75, 0.5);
      if (step % 8 === 6) add(step, DRUM_NOTES.hihatOpen, 55, 0.6);
    } else if (patternType === 'ambient_textures') {
      if (step === 0) add(step, DRUM_NOTES.kick, 50, 4.0);
      if (step % 16 === 8) add(step, DRUM_NOTES.hihatOpen, 35, 2.0);
    } else if (patternType === 'hihat_16ths') {
      if (isKickStep) add(step, DRUM_NOTES.kick, 110, 0.5);
      if (isBackbeat) add(step, DRUM_NOTES.snare, 100, 0.4);
      add(step, DRUM_NOTES.hihatClosed, 60 + rng() * 10, 0.2);
    } else {
      if (isKickStep) add(step, DRUM_NOTES.kick, 100, 0.5);
      if (isOffbeat) add(step, DRUM_NOTES.hihatClosed, 60, 0.3);
    }
  }

  return events;
}

export function generateBassPattern(
  patternType: string,
  chord: ParsedChord,
  barTicks: number,
  style: string,
  barIndex: number
): RawEvent[] {
  const events: RawEvent[] = [];
  const stepTicks = barTicks / 16;
  const rng = mulberry32(barIndex * 67890 + patternType.length);
  const root = chord.root;

  const rootMidi = (octave: number) => root + (octave + 1) * 12;
  const fifthMidi = (octave: number) => ((root + 7) % 12) + (octave + 1) * 12;

  function add(step: number, note: number, velocity: number, durationFactor: number): void {
    events.push({
      time: step * stepTicks,
      duration: Math.max(1, stepTicks * durationFactor),
      note,
      velocity: clampVelocity(velocity),
    });
  }

  if (patternType === 'root_fifth_octave') {
    add(0, rootMidi(2), 110, 4);
    add(4, fifthMidi(2), 100, 4);
    add(8, rootMidi(3), 105, 4);
    add(12, fifthMidi(2), 100, 4);
  } else if (patternType === 'analog_sequence') {
    for (let step = 0; step < 8; step++) {
      const note = step % 4 === 0 ? rootMidi(2) : step % 4 === 2 ? fifthMidi(2) : rootMidi(3);
      add(step * 2, note, 95 + rng() * 10, 1.5);
    }
  } else if (patternType === 'synthwave_bass') {
    for (let step = 0; step < 8; step++) {
      if (step % 2 === 0) {
        add(step * 2, rootMidi(2), 110, 1.8);
      } else if (step === 3 || step === 7) {
        add(step * 2, fifthMidi(2), 95, 1.5);
      }
    }
  } else if (patternType === 'techno_bass') {
    for (let step = 0; step < 16; step++) {
      if (step % 8 === 0 || step % 8 === 3 || step % 8 === 6) {
        add(step, rootMidi(1), 115, 0.8);
      }
    }
  } else if (patternType === 'edm_bass') {
    add(0, rootMidi(2), 115, 7.5);
    add(8, fifthMidi(2), 105, 7.5);
  } else {
    add(0, rootMidi(2), 100, 8);
  }

  return events;
}

export function generateArpeggioPattern(
  patternType: string,
  chord: ParsedChord,
  barTicks: number,
  style: string,
  octaveShift: number,
  barIndex: number
): RawEvent[] {
  const events: RawEvent[] = [];
  const rng = mulberry32(barIndex * 11111 + patternType.length);
  const baseOctave = style === 'jarre' ? 4 : 5;
  const notes = chord.notes.map((n) => (n % 12) + (baseOctave + octaveShift + 1) * 12);

  const isFast = patternType.includes('16ths');
  const steps = isFast ? 16 : 8;
  const stepTicks = barTicks / steps;
  const velocity = style === 'jarre' ? 70 : style === 'ambient' ? 55 : 80;

  for (let step = 0; step < steps; step++) {
    if (style === 'ambient' && step % 2 === 1) continue;

    let noteIndex: number;
    if (patternType === 'arp_down' || patternType === 'arp_slow_down') {
      noteIndex = notes.length - 1 - (step % notes.length);
    } else if (patternType === 'arp_up_down') {
      const cycle = step % (notes.length * 2 - 2);
      noteIndex = cycle < notes.length ? cycle : notes.length * 2 - 2 - cycle;
    } else {
      noteIndex = step % notes.length;
    }

    events.push({
      time: step * stepTicks,
      duration: stepTicks * 0.75,
      note: notes[noteIndex],
      velocity: clampVelocity(velocity + rng() * 15),
    });
  }

  return events;
}

export function generateChordPattern(
  patternType: string,
  chord: ParsedChord,
  barTicks: number,
  style: string,
  barIndex: number
): RawEvent[] {
  const events: RawEvent[] = [];
  const rng = mulberry32(barIndex * 22222 + patternType.length);
  const baseOctave = 4;
  const notes = chord.notes.map((n) => (n % 12) + (baseOctave + 1) * 12);
  const velocity = style === 'ambient' ? 50 : style === 'jarre' ? 60 : 70;

  if (patternType === 'chord_stabs' || patternType === 'stab_chords') {
    for (const step of [0, 8]) {
      const time = step * (barTicks / 16);
      notes.forEach((note, i) => {
        events.push({
          time: time + i * 3,
          duration: barTicks / 8,
          note,
          velocity: clampVelocity(velocity + 15 + rng() * 10),
        });
      });
    }
  } else {
    notes.forEach((note, i) => {
      events.push({
        time: i * 4,
        duration: barTicks - i * 8,
        note,
        velocity: clampVelocity(velocity + rng() * 10),
      });
    });
  }

  return events;
}

export function generateLeadPattern(
  patternType: string,
  chord: ParsedChord,
  scale: number[],
  barTicks: number,
  style: string,
  barIndex: number
): RawEvent[] {
  const events: RawEvent[] = [];
  const rng = mulberry32(barIndex * 33333 + patternType.length);
  const baseOctave = style === 'jarre' ? 5 : 6;
  const sourceNotes = chord.notes.length >= 3 ? chord.notes : scale;
  const shifted = sourceNotes.map((n) => (n % 12) + (baseOctave + 1) * 12);

  if (patternType === 'oxygene_lead') {
    const note1 = shifted[barIndex % shifted.length];
    events.push({ time: 0, duration: barTicks, note: note1, velocity: 70 });
    if (barIndex % 2 === 1) {
      const note2 = shifted[(barIndex + 2) % shifted.length];
      events.push({ time: barTicks / 2, duration: barTicks / 2, note: note2, velocity: 65 });
    }
  } else if (patternType === 'melody') {
    const phraseLength = 8;
    const stepTicks = barTicks / phraseLength;
    for (let step = 0; step < phraseLength; step++) {
      if (step % 2 === 0 || (step === 3 && rng() > 0.3)) {
        const note = shifted[(step + barIndex) % shifted.length];
        events.push({
          time: step * stepTicks,
          duration: stepTicks * (rng() > 0.5 ? 1.2 : 0.8),
          note,
          velocity: clampVelocity(80 + rng() * 20),
        });
      }
    }
  } else {
    const note = shifted[barIndex % shifted.length];
    events.push({ time: 0, duration: barTicks, note, velocity: 75 });
  }

  return events;
}

export function generateDronePattern(barTicks: number, chord: ParsedChord): RawEvent[] {
  const base = chord.root + (2 + 1) * 12;
  return [
    { time: 0, duration: barTicks, note: base, velocity: 45 },
    { time: 0, duration: barTicks, note: base + 12, velocity: 35 },
  ];
}

export function generateFxPattern(barTicks: number, barIndex: number): RawEvent[] {
  if (barIndex === 0 || barIndex % 8 === 7) {
    return [{ time: 0, duration: barTicks, note: 96, velocity: 40 }];
  }
  return [];
}

export function generateTrackEvents(
  trackName: string,
  pattern: string,
  chord: ParsedChord,
  scale: number[],
  style: string,
  barIndex: number
): RawEvent[] {
  const name = trackName.toLowerCase();
  const barTicks = BAR_TICKS;

  if (name.includes('drum') || name.includes('kick') || name.includes('hat')) {
    return generateDrumPattern(pattern, barTicks, style, barIndex);
  }
  if (name.includes('bass')) {
    return generateBassPattern(pattern, chord, barTicks, style, barIndex);
  }
  if (name.includes('arpeggio')) {
    const shift = name.includes('1') ? 0 : 1;
    return generateArpeggioPattern(pattern, chord, barTicks, style, shift, barIndex);
  }
  if (name.includes('drone')) {
    return generateDronePattern(barTicks, chord);
  }
  if (name.includes('pad') || name.includes('string') || name.includes('chords') || name.includes('stab')) {
    return generateChordPattern(pattern, chord, barTicks, style, barIndex);
  }
  if (name.includes('lead')) {
    return generateLeadPattern(pattern, chord, scale, barTicks, style, barIndex);
  }
  if (name.includes('fx')) {
    return generateFxPattern(barTicks, barIndex);
  }
  return generateChordPattern(pattern, chord, barTicks, style, barIndex);
}

export function generateMidiEvents(config: GenerationConfig): Record<string, RawEvent[]> {
  const scale = scaleNotes(config.key, config.scale as Scale, 4);
  const eventsByTrack: Record<string, RawEvent[]> = {};

  for (const trackName of config.trackLayout) {
    const pattern = config.patternTypes[trackName] ?? 'chords';
    const trackEvents: RawEvent[] = [];

    for (let bar = 0; bar < config.bars; bar++) {
      const chordName = config.chordProgression[bar % config.chordProgression.length];
      const chord = parseChord(chordName, 4);
      const barStart = bar * BAR_TICKS;
      const barEvents = generateTrackEvents(trackName, pattern, chord, scale, config.style, bar);

      for (const evt of barEvents) {
        trackEvents.push({ ...evt, time: barStart + evt.time });
      }
    }

    eventsByTrack[trackName] = trackEvents;
  }

  return eventsByTrack;
}

export function eventsToMidiEvents(events: RawEvent[]): MidiEvent[] {
  return events.map((evt) => ({
    pitch: evt.note,
    velocity: clampVelocity(evt.velocity),
    start: evt.time / TICKS_PER_BEAT,
    duration: evt.duration / TICKS_PER_BEAT,
  }));
}
