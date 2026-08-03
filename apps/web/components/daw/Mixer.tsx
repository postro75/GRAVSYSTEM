'use client';

import { Track } from '@gravsystem/core';
import { Volume2, VolumeX, Headphones } from 'lucide-react';

export interface MixerProps {
  tracks: Track[];
  onChange: (trackId: string, updates: Partial<Pick<Track, 'volume' | 'pan' | 'mute' | 'solo'>>) => void;
}

export function Mixer({ tracks, onChange }: MixerProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="mb-3 text-sm font-semibold text-apple-text">Mixer</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {tracks.map((track) => (
          <div
            key={track.id}
            className={`flex flex-col gap-2 rounded-xl border p-3 transition ${
              track.mute ? 'border-apple-danger/30 bg-apple-danger/5' : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="truncate text-xs font-medium text-apple-text">{track.name}</div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onChange(track.id, { mute: !track.mute })}
                className={`rounded p-1 transition ${
                  track.mute ? 'bg-apple-danger text-white' : 'bg-white/10 text-apple-muted hover:bg-white/15'
                }`}
                title="Mute"
              >
                {track.mute ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
              <button
                type="button"
                onClick={() => onChange(track.id, { solo: !track.solo })}
                className={`rounded p-1 transition ${
                  track.solo ? 'bg-apple-accent text-white' : 'bg-white/10 text-apple-muted hover:bg-white/15'
                }`}
                title="Solo"
              >
                <Headphones size={12} />
              </button>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wide text-apple-muted">Vol</label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={track.volume ?? 1}
                onChange={(e) => onChange(track.id, { volume: Number(e.target.value) })}
                className="w-full accent-apple-accent"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wide text-apple-muted">Pan</label>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={track.pan ?? 0}
                onChange={(e) => onChange(track.id, { pan: Number(e.target.value) })}
                className="w-full accent-apple-accent"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
