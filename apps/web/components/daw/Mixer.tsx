'use client';

import { Track } from '@gravsystem/core';
import { Volume2, VolumeX, Headphones } from 'lucide-react';
import { trackStyle } from '@/lib/track-styles';

export interface MixerProps {
  tracks: Track[];
  onChange: (trackId: string, updates: Partial<Pick<Track, 'volume' | 'pan' | 'mute' | 'solo'>>) => void;
}

function formatDb(value: number): string {
  if (value <= 0) return '-∞';
  const db = 20 * Math.log10(value);
  if (db < -60) return '-∞';
  return `${db.toFixed(1)} dB`;
}

function panLabel(value: number): string {
  if (value === 0) return 'C';
  return value > 0 ? `R${Math.round(value * 100)}` : `L${Math.round(Math.abs(value) * 100)}`;
}

export function Mixer({ tracks, onChange }: MixerProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="mb-3 text-sm font-semibold text-apple-text">Mixer</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {tracks.map((track) => {
          const style = trackStyle(track.name);
          const Icon = style.icon;
          return (
            <div
              key={track.id}
              className="flex flex-col gap-2 rounded-xl border p-3 transition"
              style={{
                borderColor: track.mute ? 'rgba(239,68,68,0.3)' : `${style.color}40`,
                backgroundColor: track.mute ? 'rgba(239,68,68,0.08)' : style.bg,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${style.color}30`, color: style.color }}
                >
                  <Icon size={14} />
                </div>
                <div className="truncate text-xs font-medium text-apple-text" title={track.name}>
                  {track.name}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onChange(track.id, { mute: !track.mute })}
                  className={`rounded p-1 transition ${
                    track.mute ? 'bg-apple-danger text-white' : 'bg-white/10 text-apple-muted hover:bg-white/15'
                  }`}
                  title={track.mute ? 'Unmute' : 'Mute'}
                >
                  {track.mute ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => onChange(track.id, { solo: !track.solo })}
                  className={`rounded p-1 transition ${
                    track.solo ? 'bg-apple-accent text-white' : 'bg-white/10 text-apple-muted hover:bg-white/15'
                  }`}
                  title={track.solo ? 'Unsolo' : 'Solo'}
                >
                  <Headphones size={12} />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-wide text-apple-muted">Volume</label>
                  <span className="text-[10px] tabular-nums text-apple-text">{formatDb(track.volume ?? 1)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={track.volume ?? 1}
                  onChange={(e) => onChange(track.id, { volume: Number(e.target.value) })}
                  className="w-full accent-apple-accent"
                  style={{ accentColor: style.color }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-wide text-apple-muted">Pan</label>
                  <span className="text-[10px] tabular-nums text-apple-text">{panLabel(track.pan ?? 0)}</span>
                </div>
                <input
                  type="range"
                  min={-1}
                  max={1}
                  step={0.05}
                  value={track.pan ?? 0}
                  onChange={(e) => onChange(track.id, { pan: Number(e.target.value) })}
                  className="w-full accent-apple-accent"
                  style={{ accentColor: style.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
