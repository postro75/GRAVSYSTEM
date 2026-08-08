'use client';

import { Track } from '@gravsystem/core';
import { VolumeX } from 'lucide-react';
import { trackStyle, TRACK_ROW_HEIGHT } from '@/lib/track-styles';
import { Knob } from './Knob';

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
            const volume = track.volume ?? 1;
            const pan = track.pan ?? 0;

            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack?.(track.id)}
                className={`group relative flex select-none border-b border-apple-border transition ${
                  isSelected ? 'bg-apple-bg' : 'hover:bg-apple-surface-raised'
                }`}
                style={{ height: TRACK_ROW_HEIGHT }}
              >
                {/* Color strip + selected indicator */}
                <div
                  className="w-1.5 shrink-0 transition-all"
                  style={{
                    backgroundColor: style.color,
                    boxShadow: isSelected ? `3px 0 0 ${style.color}` : 'none',
                  }}
                />

                <div className="flex min-w-0 flex-1 flex-col p-2">
                  {/* Top row: icon/name/instrument + M/S */}
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
                      style={{ backgroundColor: `${style.color}22`, color: style.color }}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate text-xs font-semibold ${
                          isSelected ? 'text-apple-text' : 'text-apple-text/90'
                        }`}
                        title={track.name}
                      >
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
                            ? 'bg-apple-danger text-white shadow-sm'
                            : 'border border-apple-border bg-apple-surface-raised text-apple-muted hover:border-apple-danger hover:text-apple-text'
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
                            ? 'bg-apple-accent text-white shadow-sm'
                            : 'border border-apple-border bg-apple-surface-raised text-apple-muted hover:border-apple-accent hover:text-apple-text'
                        }`}
                        title={track.solo ? 'Unsolo' : 'Solo'}
                      >
                        S
                      </button>
                    </div>
                  </div>

                  {/* Bottom row: volume fader, meter, pan knob */}
                  <div className="mt-auto flex items-end gap-2 pt-1.5">
                    <div className="flex flex-1 flex-col gap-1.5">
                      {/* Horizontal volume fader */}
                      <div className="relative h-4 w-full rounded bg-apple-border/60">
                        <div
                          className="absolute bottom-0 left-0 top-0 rounded bg-gradient-to-r from-apple-accent/70 to-apple-accent transition-all"
                          style={{ width: `${Math.min(100, volume * 50)}%` }}
                        />
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={0.02}
                          value={volume}
                          onChange={(e) => onTrackChange(track.id, { volume: Number(e.target.value) })}
                          onClick={(e) => e.stopPropagation()}
                          className="daw-range absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          aria-label="Volume"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {/* VU meter */}
                        <div className="relative h-1.5 flex-1 overflow-hidden rounded bg-apple-border/60">
                          <div
                            className="absolute bottom-0 left-0 top-0 rounded bg-apple-accent transition-all"
                            style={{ width: `${Math.min(100, level * 100)}%` }}
                          />
                        </div>

                        <span className="w-12 text-right text-[10px] tabular-nums text-apple-muted">
                          {formatDb(volume)}
                        </span>
                      </div>
                    </div>

                    {/* Pan knob */}
                    <div className="flex flex-col items-center">
                      <Knob
                        value={pan}
                        min={-1}
                        max={1}
                        step={0.05}
                        size={32}
                        onChange={(value) => onTrackChange(track.id, { pan: value })}
                        title="Pan"
                      />
                      <span className="text-[9px] tabular-nums text-apple-muted">{panLabel(pan)}</span>
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
