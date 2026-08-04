import { z } from 'zod';

export const MidiEventSchema = z.object({
  pitch: z.number().int().min(0).max(127),
  velocity: z.number().int().min(0).max(127).default(100),
  start: z.number().nonnegative(), // beats
  duration: z.number().positive(), // beats
});

export const EffectSchema = z.object({
  type: z.enum(['eq', 'compressor', 'reverb', 'delay', 'filter', 'limiter', 'chorus', 'distortion']),
  parameters: z.record(z.union([z.number(), z.string(), z.boolean()])).default({}),
});

export const RegionSchema = z.object({
  id: z.string().uuid(),
  trackId: z.string().uuid(),
  name: z.string().default('Region'),
  startBeat: z.number().nonnegative().default(0),
  duration: z.number().positive(),
  type: z.enum(['midi', 'audio']),
  midiEvents: z.array(MidiEventSchema).default([]),
  audioUrl: z.string().optional(),
  transpose: z.number().int().default(0),
  gain: z.number().default(1),
});

export const TrackSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['midi', 'audio', 'group', 'return']),
  instrument: z.string().optional(),
  instrumentType: z.enum(['custom', 'soundfont', 'drums']).optional(),
  channel: z.number().int().min(1).max(128).default(1),
  regions: z.array(RegionSchema).default([]),
  volume: z.number().min(0).max(2).default(1),
  pan: z.number().min(-1).max(1).default(0),
  mute: z.boolean().default(false),
  solo: z.boolean().default(false),
  effects: z.array(EffectSchema).default([]),
});

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().optional(),
  title: z.string().default('Untitled Project'),
  description: z.string().default(''),
  style: z.string().default('dance'),
  bpm: z.number().positive().default(120),
  key: z.string().default('C'),
  scale: z.enum(['major', 'minor']).default('minor'),
  timeSignature: z.tuple([z.number(), z.number()]).default([4, 4]),
  bars: z.number().positive().default(16),
  tracks: z.array(TrackSchema).default([]),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
  version: z.number().int().default(1),
});

export const GenerationRequestSchema = z.object({
  description: z.string().min(1).max(2000),
  style: z.string().default('dance'),
  bpm: z.number().positive().optional(),
  key: z.string().optional(),
  scale: z.enum(['major', 'minor']).optional(),
  bars: z.number().positive().optional(),
});

export type MidiEvent = z.infer<typeof MidiEventSchema>;
export type Effect = z.infer<typeof EffectSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type GenerationRequest = z.infer<typeof GenerationRequestSchema>;

export function createProject(input: Partial<Project> & { title: string }): Project {
  return ProjectSchema.parse({
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description ?? '',
    style: input.style ?? 'dance',
    bpm: input.bpm ?? 120,
    key: input.key ?? 'C',
    scale: input.scale ?? 'minor',
    timeSignature: input.timeSignature ?? [4, 4],
    bars: input.bars ?? 16,
    tracks: input.tracks ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function createTrack(input: Partial<Track> & { name: string }): Track {
  return TrackSchema.parse({
    id: crypto.randomUUID(),
    name: input.name,
    type: input.type ?? 'midi',
    instrument: input.instrument,
    channel: input.channel ?? 1,
    regions: input.regions ?? [],
    volume: input.volume ?? 1,
    pan: input.pan ?? 0,
    mute: input.mute ?? false,
    solo: input.solo ?? false,
    effects: input.effects ?? [],
  });
}

export function createRegion(input: Partial<Region> & { trackId: string; duration: number }): Region {
  return RegionSchema.parse({
    id: crypto.randomUUID(),
    trackId: input.trackId,
    name: input.name ?? 'Region',
    startBeat: input.startBeat ?? 0,
    duration: input.duration,
    type: input.type ?? 'midi',
    midiEvents: input.midiEvents ?? [],
    audioUrl: input.audioUrl,
    transpose: input.transpose ?? 0,
    gain: input.gain ?? 1,
  });
}
