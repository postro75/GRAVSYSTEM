'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Region, MidiEvent } from '@gravsystem/core';
import { isInScale, Scale } from '@/lib/music-theory';
import { SnapGrid, ToolMode } from './TransportBar';

export interface PianoRollProps {
  region: Region;
  bpm?: number;
  bars?: number;
  keyRoot?: string;
  scale?: Scale;
  snapGrid?: SnapGrid;
  toolMode?: ToolMode;
  onChange?: (region: Region) => void;
}

const BEAT_WIDTH = 60;
const NOTE_HEIGHT = 14;
const DEFAULT_BARS = 16;
const BEATS_PER_BAR = 4;
const MIN_PITCH = 36;
const MAX_PITCH = 96;
const VELOCITY_LANE_HEIGHT = 72;

export function PianoRoll({
  region,
  bpm = 120,
  bars = DEFAULT_BARS,
  keyRoot = 'C',
  scale = 'minor',
  snapGrid = '1/16',
  toolMode = 'cursor',
  onChange,
}: PianoRollProps) {
  const totalBeats = bars * BEATS_PER_BAR;
  const snapStep = snapGrid === 'off' ? 0.015625 : 1 / Number(snapGrid.split('/')[1]);
  const gridHeight = (MAX_PITCH - MIN_PITCH + 1) * NOTE_HEIGHT;

  const [events, setEvents] = useState<MidiEvent[]>(region.midiEvents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<MidiEvent[][]>([region.midiEvents]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const previewSynthRef = useRef<Tone.PolySynth | null>(null);
  const previewStartedRef = useRef(false);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const laneScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScrollRef = useRef(false);

  const ensurePreviewSynth = async () => {
    if (!previewSynthRef.current) {
      previewSynthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.2 },
        volume: -8,
      }).toDestination();
    }
    if (!previewStartedRef.current) {
      await Tone.start();
      previewStartedRef.current = true;
    }
  };

  const playPreview = async (pitch: number, velocity = 100) => {
    await ensurePreviewSynth();
    const vel = Math.max(0, Math.min(1, velocity / 127));
    previewSynthRef.current?.triggerAttackRelease(pitch, '16n', Tone.now(), vel);
  };

  useEffect(() => {
    return () => {
      previewSynthRef.current?.dispose();
      previewSynthRef.current = null;
    };
  }, []);

  useEffect(() => {
    setEvents(region.midiEvents);
    setHistory([region.midiEvents]);
    setHistoryIndex(0);
  }, [region]);

  const sendChange = useCallback(
    (next: MidiEvent[]) => {
      setEvents(next);
      onChange?.({ ...region, midiEvents: next });
    },
    [onChange, region]
  );

  const pushHistory = useCallback(
    (next: MidiEvent[]) => {
      const trimmed = history.slice(0, historyIndex + 1);
      const newHistory = [...trimmed, next];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      sendChange(next);
    },
    [history, historyIndex, sendChange]
  );

  const commit = useCallback(
    (next: MidiEvent[]) => {
      pushHistory(next);
    },
    [pushHistory]
  );

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    setHistoryIndex(nextIndex);
    sendChange(history[nextIndex]);
  }, [history, historyIndex, sendChange]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    setHistoryIndex(nextIndex);
    sendChange(history[nextIndex]);
  }, [history, historyIndex, sendChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Sync horizontal scroll between note grid and velocity lane.
  const syncScroll = (source: 'grid' | 'lane') => {
    if (isSyncingScrollRef.current) return;
    isSyncingScrollRef.current = true;
    requestAnimationFrame(() => {
      const grid = gridScrollRef.current;
      const lane = laneScrollRef.current;
      if (source === 'grid' && grid && lane) {
        lane.scrollLeft = grid.scrollLeft;
      } else if (source === 'lane' && grid && lane) {
        grid.scrollLeft = lane.scrollLeft;
      }
      isSyncingScrollRef.current = false;
    });
  };

  const snap = (value: number, step: number) => Math.round(value / step) * step;

  const handleAdd = (e: React.MouseEvent<HTMLDivElement>) => {
    if (toolMode !== 'pencil') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = rect.height - (e.clientY - rect.top);
    const start = Math.max(0, snap(x / BEAT_WIDTH, snapStep));
    const pitch = Math.min(MAX_PITCH, Math.max(MIN_PITCH, Math.floor(y / NOTE_HEIGHT) + MIN_PITCH));

    const newEvent: MidiEvent = {
      pitch,
      velocity: 100,
      start,
      duration: snapStep,
    };
    playPreview(pitch, 100);
    commit([...events, newEvent]);
  };

  const handleSelect = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setSelectedId(String(index));
  };

  const handleDelete = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const next = events.filter((_, i) => i !== index);
    commit(next);
    setSelectedId(null);
  };

  const extendDuration = () => {
    if (selectedId === null) return;
    const index = Number(selectedId);
    const next = events.map((evt, i) =>
      i === index ? { ...evt, duration: Math.min(4, evt.duration + snapStep) } : evt
    );
    commit(next);
  };

  const selectedEvent = selectedId !== null ? events[Number(selectedId)] : undefined;

  const setVelocity = (velocity: number) => {
    if (selectedId === null) return;
    const index = Number(selectedId);
    const clamped = Math.max(1, Math.min(127, Math.round(velocity)));
    const next = events.map((evt, i) => (i === index ? { ...evt, velocity: clamped } : evt));
    if (selectedEvent) {
      playPreview(selectedEvent.pitch, clamped);
    }
    commit(next);
  };

  // Note dragging
  const dragRef = useRef<{
    index: number;
    startX: number;
    startY: number;
    startBeat: number;
    pitch: number;
  } | null>(null);
  const didDragRef = useRef(false);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const { index, startX, startY, startBeat, pitch } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        didDragRef.current = true;
      }
      const newStart = Math.max(0, snap(startBeat + dx / BEAT_WIDTH, snapStep));
      const newPitch = Math.min(
        MAX_PITCH,
        Math.max(MIN_PITCH, pitch - Math.round(dy / NOTE_HEIGHT))
      );
      setEvents((prev) =>
        prev.map((evt, i) => (i === index ? { ...evt, start: newStart, pitch: newPitch } : evt))
      );
    };

    const handleUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      // Commit using the latest state in the next tick to avoid stale closure.
      setEvents((current) => {
        commit(current);
        return current;
      });
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [commit, snapStep]);

  const handleNotePointerDown = (e: React.PointerEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    const evt = events[index];
    playPreview(evt.pitch, evt.velocity);
    dragRef.current = {
      index,
      startX: e.clientX,
      startY: e.clientY,
      startBeat: evt.start,
      pitch: evt.pitch,
    };
    didDragRef.current = false;
    setSelectedId(String(index));
  };

  // Velocity lane editing
  const velocityDragRef = useRef<{
    index: number;
    startY: number;
    startVelocity: number;
  } | null>(null);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!velocityDragRef.current) return;
      const { index, startY, startVelocity } = velocityDragRef.current;
      const dy = startY - e.clientY;
      const ratio = dy / VELOCITY_LANE_HEIGHT;
      const nextVelocity = Math.max(1, Math.min(127, Math.round(startVelocity + ratio * 127)));
      setEvents((prev) =>
        prev.map((evt, i) => (i === index ? { ...evt, velocity: nextVelocity } : evt))
      );
    };

    const handleUp = () => {
      if (!velocityDragRef.current) return;
      velocityDragRef.current = null;
      setEvents((current) => {
        commit(current);
        return current;
      });
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [commit, snapStep]);

  const handleVelocityPointerDown = (e: React.PointerEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    const evt = events[index];
    playPreview(evt.pitch, evt.velocity);
    velocityDragRef.current = {
      index,
      startY: e.clientY,
      startVelocity: evt.velocity,
    };
    setSelectedId(String(index));
  };

  const handleVelocityLaneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (laneScrollRef.current?.scrollLeft ?? 0);
    const y = rect.height - (e.clientY - rect.top);
    const clickBeat = x / BEAT_WIDTH;
    const clickVelocity = Math.max(1, Math.min(127, Math.round((y / VELOCITY_LANE_HEIGHT) * 127)));

    // Find the closest note under the click and set its velocity.
    let closestIndex = -1;
    let closestDistance = Infinity;
    events.forEach((evt, i) => {
      const center = evt.start + evt.duration / 2;
      const distance = Math.abs(center - clickBeat);
      if (distance < closestDistance && clickBeat >= evt.start - 0.125 && clickBeat <= evt.start + evt.duration + 0.125) {
        closestDistance = distance;
        closestIndex = i;
      }
    });

    if (closestIndex !== -1) {
      const next = events.map((evt, i) =>
        i === closestIndex ? { ...evt, velocity: clickVelocity } : evt
      );
      setSelectedId(String(closestIndex));
      playPreview(events[closestIndex].pitch, clickVelocity);
      commit(next);
    }
  };

  return (
    <div className="flex h-full flex-col bg-apple-bg">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-apple-border px-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-apple-text">{region.name}</span>
          <span className="text-[10px] text-apple-muted">
            {bpm} BPM · {bars} bars · {keyRoot} {scale} · click grid to add, drag notes to move
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="rounded-md bg-apple-surface-raised px-2 py-1 text-[10px] text-apple-text transition hover:bg-apple-surface disabled:opacity-40"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="rounded-md bg-apple-surface-raised px-2 py-1 text-[10px] text-apple-text transition hover:bg-apple-surface disabled:opacity-40"
          >
            Redo
          </button>
          <button
            onClick={extendDuration}
            disabled={selectedId === null}
            className="rounded-md bg-apple-surface-raised px-2 py-1 text-[10px] text-apple-text transition hover:bg-apple-surface disabled:opacity-40"
          >
            Extend
          </button>
          {selectedEvent && (
            <div className="flex items-center gap-2 rounded-md bg-apple-surface-raised px-2 py-1">
              <span className="text-[10px] text-apple-muted">Vel</span>
              <input
                type="range"
                min={1}
                max={127}
                value={selectedEvent.velocity}
                onChange={(e) => setVelocity(Number(e.target.value))}
                className="h-1 w-20 cursor-pointer appearance-none rounded bg-apple-border accent-apple-accent"
              />
              <span className="w-6 text-right text-[10px] text-apple-text">{selectedEvent.velocity}</span>
            </div>
          )}
        </div>
      </div>

      <div
        ref={gridScrollRef}
        className="relative min-h-0 flex-1 overflow-auto"
        onScroll={() => syncScroll('grid')}
      >
        <div
          className={`relative ${
            toolMode === 'cursor' ? 'cursor-default' : toolMode === 'eraser' ? 'cursor-cell' : 'cursor-crosshair'
          }`}
          style={{
            width: totalBeats * BEAT_WIDTH,
            height: gridHeight,
          }}
          onClick={handleAdd}
        >
          {/* Grid */}
          {Array.from({ length: totalBeats * 4 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 border-l border-white/5"
              style={{ left: i * (BEAT_WIDTH / 4) }}
            />
          ))}
          {Array.from({ length: MAX_PITCH - MIN_PITCH + 1 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 border-t border-white/5"
              style={{ bottom: i * NOTE_HEIGHT }}
            />
          ))}

          {/* Notes */}
          {events.map((evt, index) => {
            const isSelected = selectedId === String(index);
            const inScale = isInScale(evt.pitch, keyRoot, scale);
            return (
              <button
                key={`${evt.pitch}-${evt.start}-${index}`}
                type="button"
                onClick={(e) => {
                  if (toolMode === 'eraser') {
                    handleDelete(e, index);
                  } else {
                    handleSelect(e, index);
                  }
                }}
                onContextMenu={(e) => handleDelete(e, index)}
                onPointerDown={(e) => {
                  if (toolMode === 'eraser') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(e, index);
                  } else {
                    handleNotePointerDown(e, index);
                  }
                }}
                className={`absolute rounded-sm ring-1 transition ${
                  isSelected
                    ? 'bg-apple-accent ring-white'
                    : inScale
                    ? 'bg-apple-accent/70 ring-apple-accent/50 hover:bg-apple-accent'
                    : 'bg-apple-accent/40 ring-apple-accent/30 hover:bg-apple-accent/60'
                }`}
                style={{
                  left: evt.start * BEAT_WIDTH,
                  bottom: (evt.pitch - MIN_PITCH) * NOTE_HEIGHT,
                  height: NOTE_HEIGHT - 2,
                  width: Math.max(4, evt.duration * BEAT_WIDTH),
                  touchAction: 'none',
                }}
                title={`Pitch ${evt.pitch} · start ${evt.start.toFixed(2)} · dur ${evt.duration.toFixed(2)} · vel ${evt.velocity}`}
              />
            );
          })}
        </div>
      </div>

      <div
        ref={laneScrollRef}
        className="relative shrink-0 overflow-x-auto overflow-y-hidden border-t border-apple-border bg-apple-surface-raised"
        style={{ height: VELOCITY_LANE_HEIGHT }}
        onScroll={() => syncScroll('lane')}
      >
        <div
          className="relative h-full cursor-crosshair"
          style={{ width: totalBeats * BEAT_WIDTH }}
          onClick={handleVelocityLaneClick}
        >
          {/* Velocity lane grid */}
          {Array.from({ length: totalBeats }).map((_, i) => (
            <div
              key={`lane-beat-${i}`}
              className="absolute top-0 bottom-0 border-l border-apple-border/30"
              style={{ left: i * BEAT_WIDTH }}
            />
          ))}
          <div className="absolute left-0 right-0 top-1/2 border-t border-apple-border/20" />

          {/* Velocity bars */}
          {events.map((evt, index) => {
            const isSelected = selectedId === String(index);
            const barHeight = Math.max(2, (evt.velocity / 127) * VELOCITY_LANE_HEIGHT);
            return (
              <button
                key={`vel-${evt.pitch}-${evt.start}-${index}`}
                type="button"
                onPointerDown={(e) => handleVelocityPointerDown(e, index)}
                className={`absolute bottom-0 rounded-t-sm transition ${
                  isSelected
                    ? 'bg-apple-accent ring-1 ring-white'
                    : 'bg-apple-accent/70 hover:bg-apple-accent'
                }`}
                style={{
                  left: evt.start * BEAT_WIDTH,
                  width: Math.max(4, evt.duration * BEAT_WIDTH),
                  height: barHeight,
                  touchAction: 'none',
                }}
                title={`Velocity ${evt.velocity}`}
              />
            );
          })}
        </div>
      </div>

      <div className="flex h-7 shrink-0 items-center border-t border-apple-border bg-apple-surface-raised px-3 text-[10px] text-apple-muted">
        {toolMode === 'pencil' ? 'Click grid to add' : toolMode === 'eraser' ? 'Click note to erase' : 'Click note to select · Drag to move'} · Right click to delete · Drag velocity bars · Cmd/Ctrl+Z undo/redo
      </div>
    </div>
  );
}
