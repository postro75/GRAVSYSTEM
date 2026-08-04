import { parseChord, scaleNotes, ParsedChord, GenerationConfig, Scale, Section, ArrangementSection } from './music-theory';
import { MidiEvent } from '@gravsystem/core';

export const TICKS_PER_BEAT = 480;
const BEATS_PER_BAR = 4;
const BAR_TICKS = BEATS_PER_BAR * TICKS_PER_BEAT;

export interface GenerationContext {
  section: Section;
  barIndex: number;
  style: string;
  humanize: boolean;
  seed: number;
}

function humanizeVelocity(velocity: number, rng: () => number): number {
  const delta = (rng() - 0.5) * 30; // +/- 15
  return clampVelocity(velocity + delta);
}

function humanizeTime(time: number, rng: () => number): number {
  const delta = (rng() - 0.5) * 48; // +/- 5% of beat (480 ticks)
  return Math.max(0, Math.round(time + delta));
}

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
  ctx: GenerationContext
): RawEvent[] {
  const events: RawEvent[] = [];
  const stepTicks = barTicks / 16;
  const rng = mulberry32(ctx.seed + ctx.barIndex * 12345 + patternType.length);
  const isFill = ctx.barIndex > 0 && ctx.barIndex % 4 === 3;
  const section = ctx.section;
  const fillIntensity = 0.8 + rng() * 0.4; // per-bar variation

  function add(step: number, note: number, velocity: number, durationFactor = 1.0): void {
    let vel = velocity;
    let time = step * stepTicks;
    if (ctx.humanize) {
      vel = humanizeVelocity(velocity, rng);
      time = humanizeTime(time, rng);
    }
    events.push({
      time,
      duration: Math.max(1, stepTicks * durationFactor),
      note,
      velocity: clampVelocity(vel),
    });
  }

  const drumMute = section === 'intro' || section === 'break' || section === 'outro';
  const kickOnly = section === 'intro' || section === 'outro';
  const intensity = section === 'drop' ? 1.1 : section === 'build' ? 0.95 : section === 'break' ? 0.6 : 0.75;

  if (drumMute && patternType !== 'ambient_textures') {
    // Very sparse or no drums in intro/break/outro
    if (section === 'intro' || section === 'outro') {
      if (ctx.barIndex === 0 || ctx.barIndex % 8 === 7) {
        add(0, DRUM_NOTES.kick, 70 * intensity, 1.5);
      }
      return events;
    }
  }

  for (let step = 0; step < 16; step++) {
    const isKickStep = step % 4 === 0;
    const isBackbeat = step % 8 === 4;
    const isOffbeat = step % 4 === 2;

    if (patternType === 'four_on_floor' || patternType === 'techno_kick') {
      if (isKickStep && !kickOnly) {
        const baseVel = patternType === 'techno_kick' ? 120 : 110;
        const accent = step === 0 ? 10 : 0;
        add(step, DRUM_NOTES.kick, (baseVel + accent) * intensity * fillIntensity, 0.6);
      }
      if (patternType === 'four_on_floor' && !kickOnly) {
        if (isOffbeat) add(step, DRUM_NOTES.hihatClosed, (70 + rng() * 20) * intensity * fillIntensity, 0.3);
        if (isBackbeat) add(step, DRUM_NOTES.clap, (100 + rng() * 10) * intensity * fillIntensity, 0.5);
        if (isFill && step > 10 && step % 2 === 0) {
          add(step, DRUM_NOTES.snare, (90 + rng() * 30) * intensity * fillIntensity, 0.4);
        }
      }
    } else if (patternType === 'techno_hats' && !kickOnly) {
      const vel = step % 2 === 0 ? 60 + rng() * 15 : 45 + rng() * 15;
      add(step, DRUM_NOTES.hihatClosed, vel * intensity * fillIntensity, 0.2);
      if (isOffbeat) add(step, DRUM_NOTES.hihatOpen, (75 + rng() * 15) * intensity * fillIntensity, 0.3);
    } else if (patternType === 'techno_drive' && !kickOnly) {
      if (isKickStep) add(step, DRUM_NOTES.kick, 120 * intensity * fillIntensity, 0.5);
      add(step, DRUM_NOTES.hihatClosed, (step % 2 === 0 ? 65 : 50) * intensity * fillIntensity, 0.2);
      if (isBackbeat) add(step, DRUM_NOTES.snare, (105 + rng() * 15) * intensity * fillIntensity, 0.4);
    } else if (patternType === 'jarre_drums') {
      // Oxygène-style: sparse kick, backbeat snare, open hats on the offbeat.
      if (step % 8 === 0) add(step, DRUM_NOTES.kick, 95 * intensity, 1.0);
      if (step % 8 === 4) add(step, DRUM_NOTES.snare, 80 * intensity, 0.6);
      if (step % 4 === 2) add(step, DRUM_NOTES.hihatOpen, 55 * intensity, 0.8);
      if (step === 14) add(step, DRUM_NOTES.snare, 70 * intensity, 0.4);
    } else if (patternType === 'synthwave_drive') {
      // Four-on-the-floor with gated snare and 16th hats.
      if (isKickStep && !kickOnly) add(step, DRUM_NOTES.kick, 110 * intensity, 0.55);
      if (isBackbeat) add(step, DRUM_NOTES.snare, 105 * intensity, 0.7);
      if (step % 2 === 0) add(step, DRUM_NOTES.hihatClosed, 60 * intensity + rng() * 10, 0.2);
      if (isOffbeat) add(step, DRUM_NOTES.hihatOpen, 70 * intensity, 0.3);
    } else if (patternType === 'dance_guetta') {
      // Driving EDM: four-on-floor, clap on 2/4, 16th hats, fills every 4 bars.
      if (isKickStep && !kickOnly) add(step, DRUM_NOTES.kick, 120 * intensity, 0.5);
      if (isBackbeat) add(step, DRUM_NOTES.clap, 110 * intensity, 0.45);
      add(step, DRUM_NOTES.hihatClosed, 55 * intensity + rng() * 15, 0.15);
      if (isFill && step > 10 && step % 2 === 0) {
        add(step, DRUM_NOTES.snare, 95 * intensity + rng() * 20, 0.35);
      }
    } else if (patternType === 'electronic_sparse') {
      if (step % 8 === 0) add(step, DRUM_NOTES.kick, 90 * intensity, 0.8);
      if (step % 8 === 4) add(step, DRUM_NOTES.snare, 75 * intensity, 0.5);
      if (step % 8 === 6) add(step, DRUM_NOTES.hihatOpen, 55 * intensity, 0.6);
    } else if (patternType === 'ambient_textures') {
      if (step === 0) add(step, DRUM_NOTES.kick, 50 * intensity, 4.0);
      if (step % 16 === 8) add(step, DRUM_NOTES.hihatOpen, 35 * intensity, 2.0);
    } else if (patternType === 'hihat_16ths' && !kickOnly) {
      if (isKickStep) add(step, DRUM_NOTES.kick, 110 * intensity, 0.5);
      if (isBackbeat) add(step, DRUM_NOTES.snare, 100 * intensity, 0.4);
      add(step, DRUM_NOTES.hihatClosed, 60 * intensity + rng() * 10, 0.2);
    } else {
      if (isKickStep && !kickOnly) add(step, DRUM_NOTES.kick, 100 * intensity, 0.5);
      if (isOffbeat && !kickOnly) add(step, DRUM_NOTES.hihatClosed, 60 * intensity, 0.3);
    }
  }

  return events;
}

export function generateBassPattern(
  patternType: string,
  chord: ParsedChord,
  barTicks: number,
  ctx: GenerationContext
): RawEvent[] {
  const events: RawEvent[] = [];
  const stepTicks = barTicks / 16;
  const rng = mulberry32(ctx.seed + ctx.barIndex * 67890 + patternType.length);
  const root = chord.root;
  const section = ctx.section;

  const rootMidi = (octave: number) => root + (octave + 1) * 12;
  const fifthMidi = (octave: number) => ((root + 7) % 12) + (octave + 1) * 12;

  function add(step: number, note: number, velocity: number, durationFactor: number): void {
    let vel = velocity;
    let time = step * stepTicks;
    if (ctx.humanize) {
      vel = humanizeVelocity(velocity, rng);
      time = humanizeTime(time, rng);
    }
    events.push({
      time,
      duration: Math.max(1, stepTicks * durationFactor),
      note,
      velocity: clampVelocity(vel),
    });
  }

  // Intro/outro: longer sustained bass notes, lower velocity
  if (section === 'intro' || section === 'outro') {
    add(0, rootMidi(2), section === 'intro' ? 75 : 65, 16);
    return events;
  }

  // Break: sparser bass
  if (section === 'break') {
    add(0, rootMidi(2), 70, 8);
    if (ctx.barIndex % 2 === 1) add(8, fifthMidi(2), 65, 8);
    return events;
  }

  const intensity = section === 'drop' ? 1.1 : section === 'build' ? 0.95 : 1;

  if (patternType === 'root_fifth_octave') {
    const variants: Array<[number, number, number, number][]> = [
      [
        [0, rootMidi(2), 110, 4],
        [4, fifthMidi(2), 100, 4],
        [8, rootMidi(3), 105, 4],
        [12, fifthMidi(2), 100, 4],
      ],
      [
        [0, rootMidi(2), 115, 8],
        [8, fifthMidi(2), 100, 8],
      ],
      [
        [0, rootMidi(2), 110, 2],
        [2, rootMidi(2), 95, 2],
        [4, fifthMidi(2), 105, 2],
        [6, fifthMidi(2), 90, 2],
        [8, rootMidi(3), 110, 2],
        [10, rootMidi(3), 95, 2],
        [12, fifthMidi(2), 100, 2],
        [14, rootMidi(2), 95, 2],
      ],
    ];
    const chosen = variants[Math.floor(rng() * variants.length)];
    for (const [step, note, vel, dur] of chosen) {
      add(step, note, vel * intensity, dur);
    }
  } else if (patternType === 'analog_sequence') {
    for (let step = 0; step < 8; step++) {
      const note = step % 4 === 0 ? rootMidi(2) : step % 4 === 2 ? fifthMidi(2) : rootMidi(3);
      add(step * 2, note, (95 + rng() * 10) * intensity, 1.5);
    }
  } else if (patternType === 'synthwave_bass') {
    for (let step = 0; step < 8; step++) {
      if (step % 2 === 0) {
        add(step * 2, rootMidi(2), 110 * intensity, 1.8);
      } else if (step === 3 || step === 7) {
        add(step * 2, fifthMidi(2), 95 * intensity, 1.5);
      }
    }
  } else if (patternType === 'techno_bass') {
    for (let step = 0; step < 16; step++) {
      if (step % 8 === 0 || step % 8 === 3 || step % 8 === 6) {
        add(step, rootMidi(1), 115 * intensity, 0.8);
      }
    }
  } else if (patternType === 'edm_bass') {
    add(0, rootMidi(2), 115 * intensity, 7.5);
    add(8, fifthMidi(2), 105 * intensity, 7.5);
  } else if (patternType === 'jarre_bass') {
    // Slow, hypnotic root-fifth with longer sustain.
    add(0, rootMidi(2), 95 * intensity, 7);
    if (ctx.barIndex % 2 === 1) {
      add(8, fifthMidi(2), 85 * intensity, 7);
    }
  } else {
    add(0, rootMidi(2), 100 * intensity, 8);
  }

  return events;
}

export function generateArpeggioPattern(
  patternType: string,
  chord: ParsedChord,
  barTicks: number,
  ctx: GenerationContext,
  octaveShift: number
): RawEvent[] {
  const events: RawEvent[] = [];
  const rng = mulberry32(ctx.seed + ctx.barIndex * 11111 + patternType.length);
  const baseOctave = ctx.style === 'jarre' ? 4 : 5;
  const notes = chord.notes.map((n) => (n % 12) + (baseOctave + octaveShift + 1) * 12);
  const section = ctx.section;

  const isFast = patternType.includes('16ths');
  const steps = isFast ? 16 : section === 'intro' || section === 'outro' ? 4 : 8;
  const stepTicks = barTicks / steps;
  const velocityBase = ctx.style === 'jarre' ? 70 : ctx.style === 'ambient' ? 55 : 80;
  const intensity = section === 'drop' ? 1.1 : section === 'build' ? 1.05 : section === 'break' ? 0.7 : 0.85;

  for (let step = 0; step < steps; step++) {
    if (ctx.style === 'ambient' && step % 2 === 1) continue;
    if ((section === 'intro' || section === 'outro') && step % 2 === 1) continue;

    let noteIndex: number;
    if (patternType === 'arp_down' || patternType === 'arp_slow_down') {
      noteIndex = notes.length - 1 - (step % notes.length);
    } else if (patternType === 'arp_up_down') {
      const cycle = step % (notes.length * 2 - 2);
      noteIndex = cycle < notes.length ? cycle : notes.length * 2 - 2 - cycle;
    } else {
      noteIndex = step % notes.length;
    }

    const velocity = clampVelocity((velocityBase + rng() * 15) * intensity);
    let time = step * stepTicks;
    if (ctx.humanize) {
      time = humanizeTime(time, rng);
    }

    events.push({
      time,
      duration: stepTicks * 0.75,
      note: notes[noteIndex],
      velocity,
    });
  }

  return events;
}

export function generateChordPattern(
  patternType: string,
  chord: ParsedChord,
  barTicks: number,
  ctx: GenerationContext
): RawEvent[] {
  const events: RawEvent[] = [];
  const rng = mulberry32(ctx.seed + ctx.barIndex * 22222 + patternType.length);
  const baseOctave = 4;
  const notes = chord.notes.map((n) => (n % 12) + (baseOctave + 1) * 12);
  const section = ctx.section;
  const velocityBase = ctx.style === 'ambient' ? 50 : ctx.style === 'jarre' ? 60 : 70;
  const intensity = section === 'drop' ? 1.15 : section === 'build' ? 1.05 : section === 'break' ? 0.7 : 0.85;

  function addChord(time: number, dur: number, vel: number): void {
    notes.forEach((note, i) => {
      let noteTime = time + i * 3;
      let velocity = vel;
      if (ctx.humanize) {
        velocity = humanizeVelocity(velocity, rng);
        noteTime = humanizeTime(noteTime, rng);
      }
      events.push({
        time: noteTime,
        duration: dur,
        note,
        velocity: clampVelocity(velocity),
      });
    });
  }

  if (patternType === 'chord_stabs' || patternType === 'stab_chords') {
    if (section === 'break') {
      addChord(0, barTicks / 4, (velocityBase + 15) * intensity * 0.6);
    } else {
      for (const step of [0, 8]) {
        if (section === 'intro' && step === 8) continue;
        const time = step * (barTicks / 16);
        addChord(time, barTicks / 8, (velocityBase + 15) * intensity + rng() * 10);
      }
    }
  } else {
    if (section === 'intro' || section === 'outro') {
      // Long fade-in/fade-out pad
      addChord(0, barTicks, velocityBase * intensity);
    } else {
      notes.forEach((note, i) => {
        let time = i * 4;
        let velocity = velocityBase * intensity + rng() * 10;
        if (ctx.humanize) {
          velocity = humanizeVelocity(velocity, rng);
          time = humanizeTime(time, rng);
        }
        events.push({
          time,
          duration: barTicks - i * 8,
          note,
          velocity: clampVelocity(velocity),
        });
      });
    }
  }

  return events;
}

export function generateLeadPattern(
  patternType: string,
  chord: ParsedChord,
  scale: number[],
  barTicks: number,
  ctx: GenerationContext
): RawEvent[] {
  const events: RawEvent[] = [];
  const rng = mulberry32(ctx.seed + ctx.barIndex * 33333 + patternType.length);
  const baseOctave = ctx.style === 'jarre' ? 5 : 6;
  const sourceNotes = chord.notes.length >= 3 ? chord.notes : scale;
  const shifted = sourceNotes.map((n) => (n % 12) + (baseOctave + 1) * 12);
  const section = ctx.section;
  const intensity = section === 'drop' ? 1.1 : section === 'build' ? 1.0 : section === 'break' ? 0.75 : 0.7;

  function add(time: number, duration: number, note: number, velocity: number): void {
    let t = time;
    let v = velocity;
    if (ctx.humanize) {
      t = humanizeTime(t, rng);
      v = humanizeVelocity(v, rng);
    }
    events.push({ time: t, duration, note, velocity: clampVelocity(v) });
  }

  if (patternType === 'oxygene_lead') {
    const note1 = shifted[ctx.barIndex % shifted.length];
    add(0, barTicks, note1, 70 * intensity);
    if (ctx.barIndex % 2 === 1 && section !== 'intro' && section !== 'outro') {
      const note2 = shifted[(ctx.barIndex + 2) % shifted.length];
      add(barTicks / 2, barTicks / 2, note2, 65 * intensity);
    }
  } else if (patternType === 'melody') {
    const phraseLength = section === 'intro' || section === 'outro' ? 4 : 8;
    const stepTicks = barTicks / phraseLength;
    const phrase = Math.floor(rng() * 3);
    for (let step = 0; step < phraseLength; step++) {
      const shouldPlay =
        phrase === 0
          ? step % 2 === 0
          : phrase === 1
          ? step % 2 === 0 || step === 3
          : step === 0 || step === 3 || step === 5 || step === 7;
      if (shouldPlay && rng() > 0.15) {
        const notePool = rng() > 0.7 && scale.length > 0 ? scale : shifted;
        const note = notePool[(step + ctx.barIndex) % notePool.length];
        add(
          step * stepTicks,
          stepTicks * (rng() > 0.5 ? 1.2 : 0.8),
          note,
          (80 + rng() * 25) * intensity
        );
      }
    }
  } else if (patternType === 'synthwave_lead') {
    // Wide, anthemic lead line with held notes and short fills.
    const phraseLength = section === 'intro' || section === 'outro' ? 4 : 8;
    const stepTicks = barTicks / phraseLength;
    const note = shifted[ctx.barIndex % shifted.length];
    add(0, stepTicks * (phraseLength - 1), note, 75 * intensity);
    if (section === 'drop' && ctx.barIndex % 2 === 1) {
      add(stepTicks * 6, stepTicks * 2, shifted[(ctx.barIndex + 2) % shifted.length], 80 * intensity);
    }
  } else {
    const note = shifted[ctx.barIndex % shifted.length];
    add(0, barTicks, note, 75 * intensity);
  }

  return events;
}

export function generateDronePattern(barTicks: number, chord: ParsedChord, ctx: GenerationContext): RawEvent[] {
  const base = chord.root + (2 + 1) * 12;
  const intensity = ctx.section === 'drop' ? 1.1 : ctx.section === 'break' ? 0.7 : 0.9;
  const velocity1 = clampVelocity(45 * intensity);
  const velocity2 = clampVelocity(35 * intensity);
  let time1 = 0;
  let time2 = 0;
  if (ctx.humanize) {
    const rng = mulberry32(ctx.barIndex * 44444);
    time1 = humanizeTime(0, rng);
    time2 = humanizeTime(0, rng);
  }
  return [
    { time: time1, duration: barTicks, note: base, velocity: velocity1 },
    { time: time2, duration: barTicks, note: base + 12, velocity: velocity2 },
  ];
}

export function generateFxPattern(barTicks: number, ctx: GenerationContext): RawEvent[] {
  if (ctx.section === 'build' || ctx.section === 'drop' || ctx.barIndex === 0 || ctx.barIndex % 8 === 7) {
    const velocity = ctx.section === 'build' ? 55 : ctx.section === 'drop' ? 50 : 40;
    let time = 0;
    if (ctx.humanize) {
      const rng = mulberry32(ctx.barIndex * 55555);
      time = humanizeTime(0, rng);
    }
    return [{ time, duration: barTicks, note: 96, velocity }];
  }
  return [];
}

function barToSection(arrangement: ArrangementSection[], bar: number): Section {
  let remaining = bar;
  for (const part of arrangement) {
    if (remaining < part.bars) return part.section;
    remaining -= part.bars;
  }
  return arrangement[arrangement.length - 1]?.section ?? 'drop';
}

export function generateTrackEvents(
  trackName: string,
  pattern: string,
  chord: ParsedChord,
  scale: number[],
  ctx: GenerationContext
): RawEvent[] {
  const name = trackName.toLowerCase();
  const barTicks = BAR_TICKS;

  if (name.includes('drum') || name.includes('kick') || name.includes('hat')) {
    return generateDrumPattern(pattern, barTicks, ctx);
  }
  if (name.includes('bass')) {
    return generateBassPattern(pattern, chord, barTicks, ctx);
  }
  if (name.includes('arpeggio')) {
    const shift = name.includes('1') ? 0 : 1;
    return generateArpeggioPattern(pattern, chord, barTicks, ctx, shift);
  }
  if (name.includes('drone')) {
    return generateDronePattern(barTicks, chord, ctx);
  }
  if (name.includes('pad') || name.includes('string') || name.includes('chords') || name.includes('stab')) {
    return generateChordPattern(pattern, chord, barTicks, ctx);
  }
  if (name.includes('lead')) {
    return generateLeadPattern(pattern, chord, scale, barTicks, ctx);
  }
  if (name.includes('fx')) {
    return generateFxPattern(barTicks, ctx);
  }
  return generateChordPattern(pattern, chord, barTicks, ctx);
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
      const section = barToSection(config.arrangement, bar);
      const ctx: GenerationContext = {
        section,
        barIndex: bar,
        style: config.style,
        humanize: config.humanize,
        seed: config.seed,
      };
      const barEvents = generateTrackEvents(trackName, pattern, chord, scale, ctx);

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
