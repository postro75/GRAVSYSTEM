import {
  Project,
  Track,
  createProject,
  createTrack,
  createRegion,
  GenerationRequest,
  DEFAULT_INSTRUMENT_PARAMS,
  DEFAULT_INSERT_EFFECTS,
} from '@gravsystem/core';
import { buildConfig } from './music-theory';
import { generateMidiEvents, eventsToMidiEvents } from './pattern-generator';
import { inferInstrumentForTrack, getInstrumentById } from './instruments';

export function generateProject(request: GenerationRequest): Project {
  const config = buildConfig(request.description, {
    style: request.style,
    bpm: request.bpm,
    key: request.key,
    scale: request.scale,
    bars: request.bars,
  });

  const midiEvents = generateMidiEvents(config);
  const tracks: Track[] = [];

  for (const [trackName, events] of Object.entries(midiEvents)) {
    const instrumentId = inferInstrumentForTrack(trackName, config.style);
    const instrumentDef = getInstrumentById(instrumentId);
    const track = createTrack({
      name: trackName,
      type: 'midi',
      instrument: instrumentId,
      instrumentType: instrumentDef?.type ?? 'custom',
      instrumentParams: DEFAULT_INSTRUMENT_PARAMS,
      insertEffects: DEFAULT_INSERT_EFFECTS,
      automation: [],
      channel: tracks.length + 1,
    });

    if (events.length > 0) {
      const startTick = Math.min(...events.map((e) => e.time));
      const endTick = Math.max(...events.map((e) => e.time + e.duration));
      const durationBeats = (endTick - startTick) / 480;

      const region = createRegion({
        trackId: track.id,
        name: `${trackName} Clip`,
        duration: durationBeats,
        type: 'midi',
        midiEvents: eventsToMidiEvents(events),
      });

      track.regions.push(region);
    }

    tracks.push(track);
  }

  return createProject({
    title: config.description.slice(0, 60) || 'Generated Project',
    description: config.description,
    style: config.style,
    bpm: config.bpm,
    key: config.key,
    scale: config.scale,
    bars: config.bars,
    tracks,
  });
}
