'use client';

import { Track } from '@gravsystem/core';
import { Volume2, VolumeX, Headphones } from 'lucide-react';
import { trackStyle } from '@/lib/track-styles';

export interface TrackHeadersProps {
  tracks: Track[];
  selectedTrackId?: string | null;
  meterLevels?: Record<string, number>;
  onTrackChange: (trackId: string, updates: Partial<Pick<Track, 'volume' | 'pan' | 'mute' | 'solo'>>) => void;
  onSelectTrack?: (trackId: string) => void;
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

export function TrackHeaders({
  tracks,
  selectedTrackId,
  meterLevels,
  onTrackChange,
  onSelectTrack,
}: TrackHeadersProps) {
  return (
    <div className="flex h-full w-56 shrink-0 flex-col overflow-hidden border-r border-apple-border bg-apple-surface">
      {/* Header */}
      <div className="flex h-8 shrink-0 items-center border-b border-apple-border bg-apple-surface-raised px-3 text-[10px] font-semibold uppercase tracking-wider text-apple-muted">
        Tracks
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-hidden">
        {tracks.length === 0 ? (
          <div className="flex h-32 items-center justify-center px-4 text-center text-xs text-apple-muted">
            No tracks yet
          </div>
        ) : (
          tracks.map((track) => {
            const style = trackStyle(track.name);
            const Icon = style.icon;
            const isSelected = selectedTrackId === track.id;

            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack?.(track.id)}
                className={`flex h-[4.5rem] flex-col justify-center gap-2 border-b border-apple-border px-3 transition ${
                  isSelected ? 'bg-white/5' : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${style.color}25`, color: style.color }}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-apple-text" title={track.name}>
                      {track.name}
                    </div>
                    <div className="truncate text-[10px] text-apple-muted">
                      {track.instrument || 'MIDI'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTrackChange(track.id, { mute: !track.mute });
                    }}
                    className={`flex h-5 w-5 items-center justify-center rounded transition ${
                      track.mute
                        ? 'bg-apple-danger text-white'
                        : 'bg-apple-bg text-apple-muted hover:text-apple-text'
                    }`}
                    title={track.mute ? 'Unmute' : 'Mute'}
                  >
                    {track.mute ? <VolumeX size={10} /> : <Volume2 size={10} />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTrackChange(track.id, { solo: !track.solo });
                    }}
                    className={`flex h-5 w-5 items-center justify-center rounded transition ${
                      track.solo
                        ? 'bg-apple-accent text-white'
                        : 'bg-apple-bg text-apple-muted hover:text-apple-text'
                    }`}
                    title={track.solo ? 'Unsolo' : 'Solo'}
                  >
                    <Headphones size={10} />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <div className="relative h-5 w-1.5 rounded bg-apple-border">
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded bg-apple-accent transition-all"
                        style={{
                          height: `${Math.round((meterLevels?.[track.id] ?? 0) * 100)}%`,
                        }}
                      />
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full transition ${
                        (meterLevels?.[track.id] ?? 0) > 0.01 ? 'bg-apple-accent shadow-[0_0_6px_rgba(59,130,246,0.8)]' : 'bg-apple-border'
                      }`}
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-0.5">
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.05}
                      value={track.volume ?? 1}
                      onChange={(e) => onTrackChange(track.id, { volume: Number(e.target.value) })}
                      onClick={(e) => e.stopPropagation()}
                      className="h-1 w-full cursor-pointer appearance-none rounded bg-apple-border accent-apple-accent"
                      style={{ accentColor: style.color }}
                    />
                    <div className="flex items-center justify-between text-[9px] tabular-nums text-apple-muted">
                      <span>{formatDb(track.volume ?? 1)}</span>
                      <span>{panLabel(track.pan ?? 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
