import { MusicConfig } from './types';
import { parseChord, scaleNotes } from './music';

const TICKS_PER_BEAT = 480;
const BEATS_PER_BAR = 4;
const BAR_TICKS = BEATS_PER_BAR * TICKS_PER_BEAT;

// Seeded random for deterministic variation
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function variableLengthQuantity(value: number): number[] {
  const bytes: number[] = [];
  let v = value;
  if (v === 0) return [0];
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  bytes[bytes.length - 1] &= 0x7f;
  return bytes;
}

class MidiTrack {
  private events: number[] = [];
  private lastTime = 0;

  addNoteOn(channel: number, note: number, velocity: number, time: number) {
    const delta = Math.max(0, time - this.lastTime);
    this.events.push(...variableLengthQuantity(delta));
    this.events.push(0x90 | channel, note & 0x7f, velocity & 0x7f);
    this.lastTime = time;
  }

  addNoteOff(channel: number, note: number, time: number) {
    const delta = Math.max(0, time - this.lastTime);
    this.events.push(...variableLengthQuantity(delta));
    this.events.push(0x80 | channel, note & 0x7f, 0);
    this.lastTime = time;
  }

  addNote(channel: number, note: number, velocity: number, start: number, duration: number) {
    this.addNoteOn(channel, note, velocity, start);
    this.addNoteOff(channel, note, start + duration);
  }

  addTempo(bpm: number, delta = 0) {
    const microsPerQuarter = Math.round(60000000 / bpm);
    this.events.push(...variableLengthQuantity(delta));
    this.events.push(
      0xff,
      0x51,
      0x03,
      (microsPerQuarter >> 16) & 0xff,
      (microsPerQuarter >> 8) & 0xff,
      microsPerQuarter & 0xff
    );
    this.lastTime = 0;
  }

  addTrackName(name: string, delta = 0) {
    this.events.push(...variableLengthQuantity(delta));
    const bytes = Array.from(new TextEncoder().encode(name));
    this.events.push(0xff, 0x03, bytes.length, ...bytes);
    this.lastTime = 0;
  }

  addProgramChange(channel: number, program: number, delta = 0) {
    this.events.push(...variableLengthQuantity(delta));
    this.events.push(0xc0 | channel, program & 0x7f);
    this.lastTime = 0;
  }

  addEndOfTrack(delta = 0) {
    this.events.push(...variableLengthQuantity(delta));
    this.events.push(0xff, 0x2f, 0x00);
  }

  getBytes(): number[] {
    return this.events;
  }
}

export interface MidiEvent {
  time: number;
  duration: number;
  note: number;
  velocity: number;
}

function clampVelocity(v: number): number {
  return Math.max(1, Math.min(127, Math.round(v)));
}

// Drum note numbers (GM)
const DRUM = {
  kick: 36,
  snare: 38,
  clap: 39,
  hihatClosed: 42,
  hihatOpen: 46,
  crash: 49,
  ride: 51,
  tomLow: 45,
};

function generateDrumPattern(patternType: string, barTicks: number, style: string, barIndex: number): MidiEvent[] {
  const events: MidiEvent[] = [];
  const stepTicks = Math.floor(barTicks / 16);
  const rng = mulberry32(barIndex * 12345 + patternType.length);

  const add = (step: number, note: number, velocity: number, durationFactor = 1) => {
    events.push({
      time: step * stepTicks,
      duration: Math.max(1, Math.floor(stepTicks * durationFactor)),
      note,
      velocity: clampVelocity(velocity),
    });
  };

  const isFill = barIndex > 0 && barIndex % 4 === 3;

  for (let step = 0; step < 16; step++) {
    const isKickStep = step % 4 === 0;
    const isBackbeat = step % 8 === 4;
    const isOffbeat = step % 4 === 2;

    if (patternType === 'four_on_floor') {
      if (isKickStep) add(step, DRUM.kick, 110 + (isFill ? rng() * 10 : 0), 0.6);
      if (isOffbeat) add(step, DRUM.hihatClosed, 70 + rng() * 15, 0.3);
      if (isBackbeat) add(step, DRUM.clap, 100, 0.5);
      if (isFill && step > 10 && step % 2 === 0) add(step, DRUM.snare, 90 + rng() * 20, 0.4);
    } else if (patternType === 'techno_kick') {
      if (isKickStep) add(step, DRUM.kick, 120 + rng() * 5, 0.5);
    } else if (patternType === 'techno_hats') {
      add(step, DRUM.hihatClosed, step % 2 === 0 ? 60 + rng() * 10 : 45 + rng() * 10, 0.2);
      if (isOffbeat) add(step, DRUM.hihatOpen, 75 + rng() * 10, 0.3);
      if (isFill && step > 11) add(step, DRUM.hihatOpen, 90, 0.2);
    } else if (patternType === 'techno_drive') {
      if (isKickStep) add(step, DRUM.kick, 120, 0.5);
      add(step, DRUM.hihatClosed, step % 2 === 0 ? 65 : 50, 0.2);
      if (isBackbeat) add(step, DRUM.snare, 105 + rng() * 10, 0.4);
      if (isFill && step > 10 && step % 2 === 0) add(step, DRUM.snare, 100, 0.3);
    } else if (patternType === 'electronic_sparse') {
      // Jarre style: sparse, cinematic
      if (step % 8 === 0) add(step, DRUM.kick, 90, 0.8);
      if (step % 8 === 4) add(step, DRUM.snare, 75, 0.5);
      if (step % 8 === 6) add(step, DRUM.hihatOpen, 55, 0.6);
    } else if (patternType === 'ambient_textures') {
      if (step === 0) add(step, DRUM.kick, 50, 4.0);
      if (step % 16 === 8) add(step, DRUM.hihatOpen, 35, 2.0);
    } else if (patternType === 'hihat_16ths') {
      if (isKickStep) add(step, DRUM.kick, 110, 0.5);
      if (isBackbeat) add(step, DRUM.snare, 100, 0.4);
      add(step, DRUM.hihatClosed, 60 + rng() * 10, 0.2);
    } else {
      // fallback sparse
      if (isKickStep) add(step, DRUM.kick, 100, 0.5);
      if (isOffbeat) add(step, DRUM.hihatClosed, 60, 0.3);
    }
  }

  return events;
}

function generateBassPattern(
  patternType: string,
  chord: { root: number; notes: number[] },
  barTicks: number,
  style: string,
  barIndex: number
): MidiEvent[] {
  const events: MidiEvent[] = [];
  const stepTicks = Math.floor(barTicks / 16);
  const rng = mulberry32(barIndex * 67890 + patternType.length);

  const rootMidi = (octave: number) => chord.root + (octave + 1) * 12;
  const fifthMidi = (octave: number) => ((chord.root + 7) % 12) + (octave + 1) * 12;

  const add = (step: number, note: number, velocity: number, durFactor: number) => {
    events.push({
      time: step * stepTicks,
      duration: Math.max(1, Math.floor(stepTicks * durFactor)),
      note,
      velocity: clampVelocity(velocity),
    });
  };

  if (patternType === 'root_fifth_octave') {
    add(0, rootMidi(2), 110, 4);
    add(4, fifthMidi(2), 100, 4);
    add(8, rootMidi(3), 105, 4);
    add(12, fifthMidi(2), 100, 4);
  } else if (patternType === 'analog_sequence') {
    // Jarre: 8th note root-octave-fifth-octave sequence
    for (let step = 0; step < 8; step++) {
      const note = step % 4 === 0 ? rootMidi(2) : step % 4 === 2 ? fifthMidi(2) : rootMidi(3);
      add(step * 2, note, 95 + rng() * 10, 1.5);
    }
  } else if (patternType === 'synthwave_bass') {
    // Syncopated 8ths with pump feel
    for (let step = 0; step < 8; step++) {
      if (step % 2 === 0) {
        add(step * 2, rootMidi(2), 110, 1.8);
      } else if (step === 3 || step === 7) {
        add(step * 2, fifthMidi(2), 95, 1.5);
      }
    }
  } else if (patternType === 'techno_bass') {
    // Offbeat/rolling 16ths
    for (let step = 0; step < 16; step++) {
      if (step % 8 === 0 || step % 8 === 3 || step % 8 === 6) {
        add(step, rootMidi(1), 115, 0.8);
      }
    }
  } else if (patternType === 'edm_bass') {
    // Long root notes with pump
    add(0, rootMidi(2), 115, 7.5);
    add(8, fifthMidi(2), 105, 7.5);
  } else {
    add(0, rootMidi(2), 100, 8);
  }

  return events;
}

function generateArpeggioPattern(
  patternType: string,
  chord: { root: number; notes: number[] },
  barTicks: number,
  style: string,
  octaveShift: number,
  barIndex: number
): MidiEvent[] {
  const events: MidiEvent[] = [];
  const rng = mulberry32(barIndex * 11111 + patternType.length);

  const baseOctave = style === 'jarre' ? 4 : style === 'ambient' ? 5 : 5;
  const notes = chord.notes.map((n) => {
    const base = n % 12;
    return base + (baseOctave + octaveShift + 1) * 12;
  });

  const isSlow = patternType.includes('slow');
  const isFast = patternType.includes('16ths');
  const steps = isFast ? 16 : isSlow ? 8 : 8;
  const stepTicks = Math.floor(barTicks / steps);
  const velocity = style === 'jarre' ? 70 : style === 'ambient' ? 55 : 80;

  for (let step = 0; step < steps; step++) {
    let noteIndex: number;
    if (patternType === 'arp_down' || patternType === 'arp_slow_down') {
      noteIndex = notes.length - 1 - (step % notes.length);
    } else if (patternType === 'arp_up_down') {
      const cycle = step % (notes.length * 2 - 2);
      noteIndex = cycle < notes.length ? cycle : notes.length * 2 - 2 - cycle;
    } else {
      noteIndex = step % notes.length;
    }

    if (style === 'ambient' && step % 2 === 1) continue; // sparser ambient

    events.push({
      time: step * stepTicks,
      duration: Math.floor(stepTicks * 0.75),
      note: notes[noteIndex],
      velocity: clampVelocity(velocity + rng() * 15),
    });
  }

  return events;
}

function generateChordPattern(
  patternType: string,
  chord: { root: number; notes: number[] },
  barTicks: number,
  style: string,
  barIndex: number
): MidiEvent[] {
  const events: MidiEvent[] = [];
  const rng = mulberry32(barIndex * 22222 + patternType.length);

  const baseOctave = style === 'jarre' ? 4 : 4;
  const notes = chord.notes.map((n) => (n % 12) + (baseOctave + 1) * 12);
  const velocity = style === 'ambient' ? 50 : style === 'jarre' ? 60 : 70;

  if (patternType === 'chord_stabs' || patternType === 'stab_chords') {
    // Short stabs on beat 1 and 3
    [0, 8].forEach((step) => {
      const time = step * Math.floor(barTicks / 16);
      notes.forEach((note, i) => {
        events.push({
          time: time + i * 3,
          duration: Math.floor(barTicks / 8),
          note,
          velocity: clampVelocity(velocity + 15 + rng() * 10),
        });
      });
    });
  } else {
    // Long pad chord
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

function generateLeadPattern(
  patternType: string,
  chord: { root: number; notes: number[] },
  scale: number[],
  barTicks: number,
  style: string,
  barIndex: number
): MidiEvent[] {
  const events: MidiEvent[] = [];
  const rng = mulberry32(barIndex * 33333 + patternType.length);

  const baseOctave = style === 'jarre' ? 5 : style === 'ambient' ? 6 : 6;
  const sourceNotes = chord.notes.length >= 3 ? chord.notes : scale;
  const shifted = sourceNotes.map((n) => (n % 12) + (baseOctave + 1) * 12);

  if (patternType === 'oxygene_lead') {
    // Jarre: long sustained notes, slow phrasing
    const note1 = shifted[barIndex % shifted.length];
    events.push({ time: 0, duration: barTicks, note: note1, velocity: 70 });
    if (barIndex % 2 === 1) {
      const note2 = shifted[(barIndex + 2) % shifted.length];
      events.push({
        time: Math.floor(barTicks / 2),
        duration: Math.floor(barTicks / 2),
        note: note2,
        velocity: 65,
      });
    }
  } else if (patternType === 'melody') {
    // Phrase with rests and dynamics
    const phraseLength = 8;
    const stepTicks = Math.floor(barTicks / phraseLength);
    for (let step = 0; step < phraseLength; step++) {
      if (step % 2 === 0 || (step === 3 && rng() > 0.3)) {
        const note = shifted[(step + barIndex) % shifted.length];
        events.push({
          time: step * stepTicks,
          duration: Math.floor(stepTicks * (rng() > 0.5 ? 1.2 : 0.8)),
          note,
          velocity: clampVelocity(80 + rng() * 20),
        });
      }
    }
  } else {
    // Fallback
    const note = shifted[barIndex % shifted.length];
    events.push({ time: 0, duration: barTicks, note, velocity: 75 });
  }

  return events;
}

function generateDronePattern(barTicks: number, chord: { root: number; notes: number[] }, _barIndex: number): MidiEvent[] {
  const base = chord.root + (2 + 1) * 12;
  return [
    { time: 0, duration: barTicks, note: base, velocity: 45 },
    { time: 0, duration: barTicks, note: base + 12, velocity: 35 },
  ];
}

function generateFxPattern(barTicks: number, barIndex: number): MidiEvent[] {
  const events: MidiEvent[] = [];
  if (barIndex === 0 || barIndex % 8 === 7) {
    events.push({ time: 0, duration: barTicks, note: 96, velocity: 40 });
  }
  return events;
}

export function generateMidiEvents(config: MusicConfig): Map<string, MidiEvent[]> {
  const events = new Map<string, MidiEvent[]>();
  const scale = scaleNotes(config.key, config.scale, 4);

  for (const trackName of config.trackLayout) {
    const pattern = config.patternTypes[trackName] || 'chords';
    const trackEvents: MidiEvent[] = [];

    for (let bar = 0; bar < config.bars; bar++) {
      const chordName = config.chordProgression[bar % config.chordProgression.length];
      const chord = parseChord(chordName, 4);
      const barStart = bar * BAR_TICKS;
      const lowerName = trackName.toLowerCase();

      let barEvents: MidiEvent[] = [];

      if (lowerName.includes('drum') || lowerName.includes('kick') || lowerName.includes('hat')) {
        barEvents = generateDrumPattern(pattern, BAR_TICKS, config.style, bar);
      } else if (lowerName.includes('bass')) {
        barEvents = generateBassPattern(pattern, chord, BAR_TICKS, config.style, bar);
      } else if (lowerName.includes('arpeggio')) {
        const shift = trackName.includes('1') ? 0 : 1;
        barEvents = generateArpeggioPattern(pattern, chord, BAR_TICKS, config.style, shift, bar);
      } else if (lowerName.includes('drone')) {
        barEvents = generateDronePattern(BAR_TICKS, chord, bar);
      } else if (lowerName.includes('pad') || lowerName.includes('string') || lowerName.includes('chords') || lowerName.includes('stab')) {
        barEvents = generateChordPattern(pattern, chord, BAR_TICKS, config.style, bar);
      } else if (lowerName.includes('lead')) {
        barEvents = generateLeadPattern(pattern, chord, scale, BAR_TICKS, config.style, bar);
      } else if (lowerName.includes('fx')) {
        barEvents = generateFxPattern(BAR_TICKS, bar);
      } else {
        barEvents = generateChordPattern(pattern, chord, BAR_TICKS, config.style, bar);
      }

      for (const evt of barEvents) {
        trackEvents.push({
          ...evt,
          time: barStart + evt.time,
        });
      }
    }

    events.set(trackName, trackEvents);
  }

  return events;
}

export function generateMidi(config: MusicConfig): string {
  const totalTicks = config.bars * BAR_TICKS;
  const tracks: MidiTrack[] = [];

  // Track 0: tempo + metadata
  const metaTrack = new MidiTrack();
  metaTrack.addTrackName(config.description.slice(0, 32));
  metaTrack.addTempo(config.bpm);
  metaTrack.addEndOfTrack(totalTicks);
  tracks.push(metaTrack);

  const eventsByTrack = generateMidiEvents(config);
  let channel = 0;

  // GM program numbers mapped by track role
  const programForTrack: Record<string, number> = {
    drums: 0,
    kick: 0,
    hats: 0,
    bass: 38, // synth bass 1
    'bass seq': 38,
    arpeggio: 81, // lead 1 square
    pad: 95, // pad 6
    'string pad': 51, // synth strings
    chords: 91, // pad 4 choir
    stab: 82, // lead 2 sawtooth
    lead: 80, // lead 1 square
    fx: 96,
    drone: 95,
  };

  for (const [trackName, trackEvents] of eventsByTrack) {
    const track = new MidiTrack();
    track.addTrackName(trackName);

    const role = Object.keys(programForTrack).find((k) => trackName.toLowerCase().includes(k));
    if (role) {
      track.addProgramChange(channel, programForTrack[role]);
    }

    const sorted = [...trackEvents].sort((a, b) => a.time - b.time);
    for (const evt of sorted) {
      track.addNote(channel, evt.note, evt.velocity, evt.time, evt.duration);
    }

    track.addEndOfTrack(totalTicks);
    tracks.push(track);
    channel = (channel + 1) % 15;
  }

  // Build MIDI file bytes
  const bytes: number[] = [];
  bytes.push(
    0x4d, 0x54, 0x68, 0x64,
    0x00, 0x00, 0x00, 0x06,
    0x00, 0x01,
    (tracks.length >> 8) & 0xff,
    tracks.length & 0xff,
    (TICKS_PER_BEAT >> 8) & 0xff,
    TICKS_PER_BEAT & 0xff
  );

  for (const track of tracks) {
    const trackBytes = track.getBytes();
    bytes.push(0x4d, 0x54, 0x72, 0x6b);
    bytes.push(
      (trackBytes.length >> 24) & 0xff,
      (trackBytes.length >> 16) & 0xff,
      (trackBytes.length >> 8) & 0xff,
      trackBytes.length & 0xff
    );
    bytes.push(...trackBytes);
  }

  const binary = bytes.map((b) => String.fromCharCode(b)).join('');
  return btoa(binary);
}
