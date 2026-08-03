'use client';

import { useRef, useState } from 'react';
import { Track, Region } from '@gravsystem/core';
import { ZoomIn, ZoomOut, MoveHorizontal, Copy, Trash2 } from 'lucide-react';

export interface TimelineProps {
  tracks?: Track[];
  bars?: number;
  position?: number; // seconds
  bpm?: number;
  onRegionClick?: (track: Track, region: Region) => void;
  onRegionChange?: (updatedRegion: Region) => void;
  onRegionDuplicate?: (region: Region) => void;
  onRegionDelete?: (region: Region) => void;
}

export function Timeline({
  tracks = [],
  bars = 16,
  position = 0,
  bpm = 120,
  onRegionClick,
  onRegionChange,
  onRegionDuplicate,
  onRegionDelete,
}: TimelineProps) {
  const [beatWidth, setBeatWidth] = useState(40);
  const [draggingRegion, setDraggingRegion] = useState<{
    id: string;
    startBeat: number;
    duration: number;
  } | null>(null);

  const totalBeats = bars * 4;
  const secondsPerBeat = 60 / bpm;
  const positionBeats = position / secondsPerBeat;
  const trackHeaderWidth = 192;

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    region: Region;
    startBeat: number;
    startDuration: number;
    startX: number;
    mode: 'move' | 'resize';
  } | null>(null);

  const minBeatWidth = 20;
  const maxBeatWidth = 120;

  const handleZoom = (delta: number) => {
    setBeatWidth((prev) => Math.max(minBeatWidth, Math.min(maxBeatWidth, prev + delta)));
  };

  const resolveRegion = (region: Region): Region => {
    if (draggingRegion && draggingRegion.id === region.id) {
      return { ...region, startBeat: draggingRegion.startBeat, duration: draggingRegion.duration };
    }
    return region;
  };

  const handlePointerDown = (
    e: React.PointerEvent,
    track: Track,
    region: Region,
    mode: 'move' | 'resize'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = {
      region,
      startBeat: region.startBeat,
      startDuration: region.duration,
      startX: e.clientX,
      mode,
    };
    setDraggingRegion({ id: region.id, startBeat: region.startBeat, duration: region.duration });

    const handleMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const dxBeats = (ev.clientX - dragRef.current.startX) / beatWidth;
      const { startBeat, startDuration, mode: m } = dragRef.current;

      if (m === 'move') {
        const newStart = Math.max(0, Math.round((startBeat + dxBeats) * 4) / 4);
        setDraggingRegion({ id: dragRef.current.region.id, startBeat: newStart, duration: startDuration });
      } else {
        const newDuration = Math.max(0.25, Math.round((startDuration + dxBeats) * 4) / 4);
        setDraggingRegion({ id: dragRef.current.region.id, startBeat, duration: newDuration });
      }
    };

    const handleUp = () => {
      if (!dragRef.current) return;
      const { region: r, startBeat, startDuration } = dragRef.current;
      const final = draggingRegion ?? { startBeat, duration: startDuration };
      onRegionChange?.({ ...r, startBeat: final.startBeat, duration: final.duration });
      dragRef.current = null;
      setDraggingRegion(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      {/* Toolbar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-3">
        <div className="flex items-center gap-2 text-xs text-apple-muted">
          <MoveHorizontal size={14} />
          <span>Drag region to move · Drag right edge to resize</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleZoom(-10)}
            className="rounded p-1 text-apple-muted transition hover:bg-white/10"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(10)}
            className="rounded p-1 text-apple-muted transition hover:bg-white/10"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Ruler */}
      <div className="flex h-8 shrink-0 border-b border-white/10 bg-white/5">
        <div className="w-48 shrink-0 border-r border-white/10" />
        <div
          ref={containerRef}
          className="relative flex-1 overflow-hidden"
          style={{ width: totalBeats * beatWidth }}
        >
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
      <div className="relative flex-1 overflow-auto">
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
              <div className="relative" style={{ width: totalBeats * beatWidth }}>
                {track.regions.map((region) => {
                  const visual = resolveRegion(region);
                  return (
                    <div
                      key={region.id}
                      className="group absolute top-2 bottom-2 cursor-grab rounded-md bg-apple-accent/30 ring-1 ring-apple-accent/50 transition hover:bg-apple-accent/40 active:cursor-grabbing"
                      style={{
                        left: visual.startBeat * beatWidth,
                        width: visual.duration * beatWidth,
                      }}
                      onClick={() => onRegionClick?.(track, region)}
                      onPointerDown={(e) => handlePointerDown(e, track, region, 'move')}
                    >
                      <div className="flex items-center justify-between px-1.5 py-1">
                        <div className="truncate text-[10px] text-apple-text">{region.name}</div>
                        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            title="Duplicate region"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRegionDuplicate?.(region);
                            }}
                            className="rounded p-0.5 text-apple-text hover:bg-white/20"
                          >
                            <Copy size={10} />
                          </button>
                          <button
                            type="button"
                            title="Delete region"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRegionDelete?.(region);
                            }}
                            className="rounded p-0.5 text-apple-danger hover:bg-white/20"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                      {/* Resize handle */}
                      <div
                        className="absolute top-0 right-0 bottom-0 w-2 cursor-e-resize bg-white/20 opacity-0 transition group-hover:opacity-100"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          handlePointerDown(e, track, region, 'resize');
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* Playback cursor */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-apple-accent"
          style={{ left: trackHeaderWidth + positionBeats * beatWidth }}
        />
      </div>
    </div>
  );
}
