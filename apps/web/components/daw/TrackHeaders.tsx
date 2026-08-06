'use client';

import { Track } from '@gravsystem/core';
import { VolumeX } from 'lucide-react';
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
    <div className="flex h-full w-64 shrink-0 flex-col overflow-hidden bg-apple-surface">
      {/* Header */}
      <div className="flex h-8 shrink-0 items-center border-b border-apple-border bg-apple-surface-raised px-3 text-[10px] font-semibold uppercase tracking-wider text-apple-muted">
        Tracks
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="flex h-32 items-center justify-center px-4 text-center text-xs text-apple-muted">
            No tracks yet
          </div>
        ) : (
          tracks.map((track) => {
            const style = trackStyle(track.name);
            const Icon = style.icon;
            const isSelected = selectedTrackId === track.id;
            const level = meterLevels?.[track.id] ?? 0;

            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack?.(track.id)}
                className={`group relative flex h-20 select-none border-b border-apple-border transition ${
                  isSelected ? 'bg-apple-bg' : 'hover:bg-apple-surface-raised'
                }`}
              >
                {/* Color strip */}
                <div
                  className="w-1.5 shrink-0"
                  style={{ backgroundColor: style.color }}
                />

                <div className="flex min-w-0 flex-1 flex-col justify-between p-2">
                  {/* Top: icon + name + M/S */}
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded"
                      style={{ backgroundColor: `${style.color}20`, color: style.color }}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-apple-text" title={track.name}>
                        {track.name}
                      </div>
                      <div className="truncate text-[10px] text-apple-muted">
                        {track.instrument || 'MIDI'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrackChange(track.id, { mute: !track.mute });
                        }}
                        className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold transition ${
                          track.mute
                            ? 'bg-apple-danger text-white'
                            : 'border border-apple-border bg-apple-bg text-apple-muted hover:text-apple-text'
                        }`}
                        title={track.mute ? 'Unmute' : 'Mute'}
                      >
                        {track.mute ? <VolumeX size={12} /> : 'M'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrackChange(track.id, { solo: !track.solo });
                        }}
                        className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold transition ${
                          track.solo
                            ? 'bg-apple-accent text-white'
                            : 'border border-apple-border bg-apple-bg text-apple-muted hover:text-apple-text'
                        }`}
                        title={track.solo ? 'Unsolo' : 'Solo'}
                      >
                        S
                      </button>
                    </div>
                  </div>

                  {/* Bottom: vertical fader + meter + pan */}
                  <div className="flex items-end gap-2">
                    {/* Vertical volume fader */}
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="relative h-16 w-5 rounded bg-apple-border">
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded bg-apple-accent transition-all"
                            style={{
                              height: `${Math.min(100, (track.volume ?? 1) * 50)}%`,
                            }}
                          />
                          <input
                            type="range"
                            min={0}
                            max={2}
                            step={0.02}
                            value={track.volume ?? 1}
                            onChange={(e) => onTrackChange(track.id, { volume: Number(e.target.value) })}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            aria-label="Volume"
                          />
                        </div>

                        {/* VU meter */}
                        <div className="relative h-16 w-1.5 overflow-hidden rounded bg-apple-border">
                          <div
                            className="absolute bottom-0 left-0 right-0 rounded bg-apple-accent transition-all"
                            style={{ height: `${Math.min(100, level * 100)}%` }}
                          />
                        </div>

                        <div className="flex flex-col justify-between py-0.5 text-[10px] tabular-nums text-apple-muted">
                          <span className={level > 0.01 ? 'text-apple-accent' : ''}>{formatDb(track.volume ?? 1)}</span>
                          <span>{panLabel(track.pan ?? 0)}</span>
                        </div>
                      </div>

                      {/* Pan slider */}
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.05}
                        value={track.pan ?? 0}
                        onChange={(e) => onTrackChange(track.id, { pan: Number(e.target.value) })}
                        onClick={(e) => e.stopPropagation()}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded bg-apple-border accent-apple-accent"
                        style={{ accentColor: style.color }}
                        aria-label="Pan"
                      />
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
