'use client';

import { useRef, useState } from 'react';
import { Track, Region } from '@gravsystem/core';
import { ZoomIn, ZoomOut, MoveHorizontal, Copy, Trash2 } from 'lucide-react';
import { trackStyle, TRACK_ROW_HEIGHT } from '@/lib/track-styles';
import { SnapGrid, ToolMode } from './TransportBar';

export interface TimelineProps {
  tracks?: Track[];
  bars?: number;
  position?: number; // seconds
  bpm?: number;
  selectedRegionId?: string | null;
  snapGrid?: SnapGrid;
  toolMode?: ToolMode;
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
  selectedRegionId,
  snapGrid = '1/16',
  toolMode = 'cursor',
  onRegionClick,
  onRegionChange,
  onRegionDuplicate,
  onRegionDelete,
}: TimelineProps) {
  const [beatWidth, setBeatWidth] = useState(56);
  const [draggingRegion, setDraggingRegion] = useState<{
    id: string;
    startBeat: number;
    duration: number;
  } | null>(null);

  const totalBeats = bars * 4;
  const secondsPerBeat = 60 / bpm;
  const positionBeats = position / secondsPerBeat;

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    region: Region;
    startBeat: number;
    startDuration: number;
    startX: number;
    mode: 'move' | 'resize';
  } | null>(null);

  const minBeatWidth = 28;
  const maxBeatWidth = 140;

  const snapStep = snapGrid === 'off' ? 0.015625 : 1 / Number(snapGrid.split('/')[1]);

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
        const newStart = Math.max(0, Math.round((startBeat + dxBeats) / snapStep) * snapStep);
        setDraggingRegion({ id: dragRef.current.region.id, startBeat: newStart, duration: startDuration });
      } else {
        const minDuration = snapGrid === 'off' ? 0.0625 : snapStep;
        const newDuration = Math.max(minDuration, Math.round((startDuration + dxBeats) / snapStep) * snapStep);
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
    <div className="flex h-full flex-col overflow-hidden bg-apple-bg">
      {/* Toolbar */}
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-apple-border bg-apple-surface-raised px-3">
        <div className="flex items-center gap-2 text-[10px] text-apple-muted">
          <MoveHorizontal size={12} />
          <span>Drag region to move · Drag right edge to resize</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleZoom(-10)}
            className="rounded p-1 text-apple-muted transition hover:bg-white/10"
            title="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            type="button"
            onClick={() => handleZoom(10)}
            className="rounded p-1 text-apple-muted transition hover:bg-white/10"
            title="Zoom in"
          >
            <ZoomIn size={13} />
          </button>
        </div>
      </div>

      {/* Ruler */}
      <div className="flex h-9 shrink-0 overflow-hidden border-b border-apple-border bg-apple-surface-raised">
        <div
          ref={containerRef}
          className="relative h-full"
          style={{ width: totalBeats * beatWidth }}
        >
          {Array.from({ length: totalBeats }).map((_, i) => {
            const isBar = i % 4 === 0;
            const beatInBar = (i % 4) + 1;
            return (
              <div
                key={i}
                className={`absolute top-0 bottom-0 border-l ${
                  isBar ? 'border-apple-text/40' : 'border-apple-border/40'
                }`}
                style={{ left: i * beatWidth }}
              >
                {isBar ? (
                  <span className="ml-1.5 select-none pt-1 text-[11px] font-bold tabular-nums text-apple-text">
                    {i / 4 + 1}
                  </span>
                ) : (
                  <span className="ml-1 select-none text-[9px] tabular-nums text-apple-muted/70">
                    {beatInBar}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tracks */}
      <div className="relative flex-1 overflow-auto">
        {tracks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-apple-muted">
            Generated tracks will appear here
          </div>
        ) : (
          <div style={{ width: totalBeats * beatWidth }}>
            {tracks.map((track, trackIndex) => {
              const style = trackStyle(track.name);
              const isEven = trackIndex % 2 === 0;
              return (
                <div
                  key={track.id}
                  className="group relative border-b border-apple-border transition"
                  style={{
                    height: TRACK_ROW_HEIGHT,
                    backgroundColor: isEven ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.04)',
                  }}
                >
                  {/* Background beat grid */}
                  {Array.from({ length: totalBeats }).map((_, i) => (
                    <div
                      key={i}
                      className={`absolute top-0 bottom-0 border-l ${
                        i % 4 === 0 ? 'border-apple-border/50' : 'border-apple-border/15'
                      }`}
                      style={{ left: i * beatWidth }}
                    />
                  ))}

                  {track.regions.map((region) => {
                    const visual = resolveRegion(region);
                    const isSelected = selectedRegionId === region.id;
                    const noteCount = region.midiEvents.length;
                    return (
                      <div
                        key={region.id}
                        className={`absolute cursor-grab overflow-hidden rounded-sm border-2 transition active:cursor-grabbing ${
                          isSelected
                            ? 'border-white shadow-[0_0_0_1px_rgba(255,255,255,0.25)]'
                            : 'border-white/30 hover:border-white/60'
                        }`}
                        style={{
                          left: visual.startBeat * beatWidth,
                          width: Math.max(4, visual.duration * beatWidth),
                          top: 8,
                          bottom: 8,
                          backgroundColor: isSelected ? `${style.color}35` : `${style.color}1f`,
                        }}
                        onClick={() => {
                          if (toolMode === 'eraser') {
                            onRegionDelete?.(region);
                          } else {
                            onRegionClick?.(track, region);
                          }
                        }}
                        onPointerDown={(e) => {
                          if (toolMode === 'eraser') {
                            e.preventDefault();
                            onRegionDelete?.(region);
                            return;
                          }
                          if (toolMode !== 'pencil') {
                            handlePointerDown(e, track, region, 'move');
                          }
                        }}
                      >
                        {/* Track-colour header strip */}
                        <div
                          className="flex h-5 items-center border-b border-white/10 px-2"
                          style={{ backgroundColor: style.color }}
                        >
                          <span className="truncate text-[10px] font-bold text-white drop-shadow">
                            {region.name}
                          </span>
                        </div>

                        <div className="flex items-center justify-between px-2 py-1">
                          <div className="truncate text-[10px] font-medium text-white/90">
                            {noteCount} note{noteCount !== 1 ? 's' : ''}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                            <button
                              type="button"
                              title="Duplicate region"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRegionDuplicate?.(region);
                              }}
                              className="rounded p-0.5 text-white/90 hover:bg-white/20"
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
                              className="rounded p-0.5 text-white/90 hover:bg-apple-danger hover:text-white"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>

                        {/* Resize handle */}
                        <div
                          className="absolute top-0 right-0 bottom-0 w-2.5 cursor-e-resize bg-white/30 opacity-0 transition hover:opacity-100"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            handlePointerDown(e, track, region, 'resize');
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Playback cursor */}
        {tracks.length > 0 && (
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-apple-accent shadow-[0_0_10px_rgba(14,165,233,0.9)]"
            style={{ left: positionBeats * beatWidth }}
          >
            <div className="absolute -top-1 -left-1.5 h-0 w-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-apple-accent" />
          </div>
        )}
      </div>
    </div>
  );
}
