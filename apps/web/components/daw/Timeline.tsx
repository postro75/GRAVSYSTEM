'use client';

import { Track } from '@gravsystem/core';

export interface TimelineProps {
  tracks?: Track[];
  bars?: number;
}

export function Timeline({ tracks = [], bars = 16 }: TimelineProps) {
  const beatWidth = 40; // px per beat
  const totalBeats = bars * 4;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {/* Ruler */}
      <div className="flex h-8 shrink-0 border-b border-white/10 bg-white/5">
        <div className="w-48 shrink-0 border-r border-white/10" />
        <div className="relative flex-1 overflow-hidden">
          {Array.from({ length: totalBeats }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-white/5 text-[10px] text-apple-muted"
              style={{ left: i * beatWidth }}
            >
              <span className="ml-1">{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-auto">
        {tracks.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-apple-muted">
            Generated tracks will appear here
          </div>
        ) : (
          tracks.map((track) => (
            <div key={track.id} className="flex h-14 border-b border-white/5 hover:bg-white/[0.02]">
              <div className="flex w-48 shrink-0 items-center border-r border-white/10 px-3 text-sm text-apple-text">
                {track.name}
              </div>
              <div className="relative flex-1">
                {track.regions.map((region) => (
                  <div
                    key={region.id}
                    className="absolute top-2 bottom-2 rounded-md bg-apple-accent/30 ring-1 ring-apple-accent/50"
                    style={{
                      left: region.startBeat * beatWidth,
                      width: region.duration * beatWidth,
                    }}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
