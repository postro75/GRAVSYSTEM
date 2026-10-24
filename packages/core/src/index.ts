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

export const InstrumentParamsSchema = z.object({
  attack: z.number().min(0).max(5).default(0.02),
  decay: z.number().min(0).max(5).default(0.2),
  sustain: z.number().min(0).max(1).default(0.7),
  release: z.number().min(0).max(10).default(0.5),
  cutoff: z.number().min(20).max(20000).default(20000),
  resonance: z.number().min(0).max(20).default(1),
  reverb: z.number().min(0).max(1).default(0.25),
  delay: z.number().min(0).max(1).default(0.2),
});

export const DEFAULT_INSTRUMENT_PARAMS = {
  attack: 0.02,
  decay: 0.2,
  sustain: 0.7,
  release: 0.5,
  cutoff: 20000,
  resonance: 1,
  reverb: 0.25,
  delay: 0.2,
};

export const AUTOMATION_PARAMS = [
  'volume',
  'pan',
  'cutoff',
  'resonance',
  'reverb',
  'delay',
  'attack',
  'decay',
  'sustain',
  'release',
] as const;

export const AutomationParamSchema = z.enum(AUTOMATION_PARAMS);

export const AUTOMATION_RANGES: Record<
  AutomationParam,
  { min: number; max: number; default: number }
> = {
  volume: { min: 0, max: 2, default: 1 },
  pan: { min: -1, max: 1, default: 0 },
  cutoff: { min: 20, max: 20000, default: 20000 },
  resonance: { min: 0, max: 20, default: 1 },
  reverb: { min: 0, max: 1, default: 0.25 },
  delay: { min: 0, max: 1, default: 0.2 },
  attack: { min: 0, max: 5, default: 0.02 },
  decay: { min: 0, max: 5, default: 0.2 },
  sustain: { min: 0, max: 1, default: 0.7 },
  release: { min: 0, max: 10, default: 0.5 },
};

export const AutomationPointSchema = z.object({
  id: z.string().uuid().default(() => crypto.randomUUID()),
  param: AutomationParamSchema,
  time: z.number().nonnegative(), // beats
  value: z.number(), // actual parameter value
});

export const DEFAULT_INSERT_EFFECTS = {
  distortion: 0,
  chorus: 0,
  eq: 0,
  compressor: 0,
  distortionBypass: false,
  chorusBypass: false,
  eqBypass: false,
  compressorBypass: false,
};

export const InsertEffectsSchema = z.object({
  distortion: z.number().min(0).max(1).default(0),
  chorus: z.number().min(0).max(1).default(0),
  eq: z.number().min(0).max(1).default(0),
  compressor: z.number().min(0).max(1).default(0),
  distortionBypass: z.boolean().default(false),
  chorusBypass: z.boolean().default(false),
  eqBypass: z.boolean().default(false),
  compressorBypass: z.boolean().default(false),
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
  instrumentType: z.enum(['custom', 'soundfont', 'drums', 'wam']).optional(),
  instrumentParams: InstrumentParamsSchema.default(() => DEFAULT_INSTRUMENT_PARAMS),
  channel: z.number().int().min(1).max(128).default(1),
  regions: z.array(RegionSchema).default([]),
  volume: z.number().min(0).max(2).default(1),
  pan: z.number().min(-1).max(1).default(0),
  mute: z.boolean().default(false),
  solo: z.boolean().default(false),
  sidechain: z.boolean().default(false),
  effects: z.array(EffectSchema).default([]),
  automation: z.array(AutomationPointSchema).default([]),
  insertEffects: InsertEffectsSchema.default(() => DEFAULT_INSERT_EFFECTS),
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
export type InstrumentParams = z.infer<typeof InstrumentParamsSchema>;
export type AutomationParam = z.infer<typeof AutomationParamSchema>;
export type AutomationPoint = z.infer<typeof AutomationPointSchema>;
export type InsertEffects = z.infer<typeof InsertEffectsSchema>;
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
    instrumentParams: input.instrumentParams ?? DEFAULT_INSTRUMENT_PARAMS,
    channel: input.channel ?? 1,
    regions: input.regions ?? [],
    volume: input.volume ?? 1,
    pan: input.pan ?? 0,
    mute: input.mute ?? false,
    solo: input.solo ?? false,
    sidechain: input.sidechain ?? false,
    effects: input.effects ?? [],
    automation: input.automation ?? [],
    insertEffects: input.insertEffects ?? DEFAULT_INSERT_EFFECTS,
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
