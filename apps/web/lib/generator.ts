import { buildConfig } from './music';
import { generateMidiEvents } from './midi';
import { MusicConfig } from './types';
import { Project, ProjectSchema, Track, MidiEvent, createProject } from '@gravsystem/core';

export interface GenerateOptions {
  description: string;
  style?: string;
  bpm?: number;
  key?: string;
  scale?: 'major' | 'minor';
  bars?: number;
}

export function generateProjectFromDescription(options: GenerateOptions): Project {
  const config: MusicConfig = {
    ...buildConfig(options.description, {
      style: options.style,
      bpm: options.bpm,
      bars: options.bars,
      key: options.key,
      scale: options.scale,
    }),
    description: options.description,
  };

  const eventsByTrack = generateMidiEvents(config);
  const project = createProject({
    title: options.description.slice(0, 60) || 'Generated Project',
    description: options.description,
    bpm: config.bpm,
    key: config.key,
    scale: config.scale,
    bars: config.bars,
  });

  const tracks: Track[] = [];
  let channel = 1;

  for (const [trackName, events] of eventsByTrack) {
    const track = _buildTrack(trackName, events, channel);
    tracks.push(track);
    channel += 1;
  }

  project.tracks = tracks;
  return ProjectSchema.parse(project);
}

function _buildTrack(trackName: string, events: import('./midi').MidiEvent[], channel: number): Track {
  const midiEvents: MidiEvent[] = events.map((evt) => ({
    pitch: evt.note,
    velocity: evt.velocity,
    start: evt.time / 480,
    duration: evt.duration / 480,
  }));

  const endBeat = midiEvents.length > 0
    ? Math.max(...midiEvents.map((e) => e.start + e.duration))
    : 0;

  return {
    id: crypto.randomUUID(),
    name: trackName,
    type: 'midi',
    instrument: _instrumentForTrack(trackName),
    channel,
    regions:
      midiEvents.length > 0
        ? [
            {
              id: crypto.randomUUID(),
              trackId: crypto.randomUUID(),
              name: `${trackName} Clip`,
              startBeat: 0,
              duration: endBeat,
              type: 'midi',
              midiEvents,
              transpose: 0,
              gain: 1,
            },
          ]
        : [],
    volume: 1,
    pan: 0,
    mute: false,
    solo: false,
    effects: [],
  };
}

function _instrumentForTrack(trackName: string): string {
  const name = trackName.toLowerCase();
  if (name.includes('drum') || name.includes('kick') || name.includes('hat')) return 'drums';
  if (name.includes('bass')) return 'bass';
  if (name.includes('arpeggio')) return 'arpeggio';
  if (name.includes('pad') || name.includes('string')) return 'pad';
  if (name.includes('chords') || name.includes('stab')) return 'chords';
  if (name.includes('lead')) return 'lead';
  if (name.includes('drone')) return 'drone';
  return 'synth';
}
