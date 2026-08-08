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
const KEY_WIDTH = 48;
const DEFAULT_BARS = 16;
const BEATS_PER_BAR = 4;
const MIN_PITCH = 36;
const MAX_PITCH = 96;
const VELOCITY_LANE_HEIGHT = 80;

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK_KEY_INDICES = new Set([1, 3, 6, 8, 10]);

function pitchName(pitch: number): string {
  const octave = Math.floor(pitch / 12) - 1;
  return `${NOTE_NAMES[pitch % 12]}${octave}`;
}

function isBlackKey(pitch: number): boolean {
  return BLACK_KEY_INDICES.has(pitch % 12);
}

function noteOpacity(velocity: number): number {
  return Math.max(0.55, 0.35 + (velocity / 127) * 0.85);
}

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

  const renderPianoKeys = () => {
    const keys = [];
    for (let pitch = MAX_PITCH; pitch >= MIN_PITCH; pitch--) {
      const black = isBlackKey(pitch);
      const inScale = isInScale(pitch, keyRoot, scale);
      const isC = pitch % 12 === 0;
      keys.push(
        <div
          key={pitch}
          className={`flex items-center border-b px-1 text-[10px] ${
            black
              ? 'justify-end bg-apple-surface-raised text-apple-muted'
              : 'bg-apple-text/[0.06] text-apple-text'
          } ${inScale ? 'bg-apple-accent/10' : ''} ${isC ? 'font-bold' : ''} border-apple-border/40`}
          style={{
            height: NOTE_HEIGHT,
            width: KEY_WIDTH,
            paddingRight: black ? 4 : 6,
          }}
        >
          {isC || !black ? pitchName(pitch) : ''}
        </div>
      );
    }
    return keys;
  };

  return (
    <div className="flex h-full flex-col bg-apple-bg">
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center border-b border-apple-border bg-apple-surface-raised">
        <div className="flex w-[48px] shrink-0 items-center justify-center border-r border-apple-border text-[10px] text-apple-muted">
          Key
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between px-3">
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
              className="rounded-md bg-apple-surface px-2 py-1 text-[10px] text-apple-text ring-1 ring-apple-border transition hover:bg-apple-surface-raised disabled:opacity-40"
            >
              Undo
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="rounded-md bg-apple-surface px-2 py-1 text-[10px] text-apple-text ring-1 ring-apple-border transition hover:bg-apple-surface-raised disabled:opacity-40"
            >
              Redo
            </button>
            <button
              onClick={extendDuration}
              disabled={selectedId === null}
              className="rounded-md bg-apple-surface px-2 py-1 text-[10px] text-apple-text ring-1 ring-apple-border transition hover:bg-apple-surface-raised disabled:opacity-40"
            >
              Extend
            </button>
            {selectedEvent && (
              <div className="flex items-center gap-2 rounded-md bg-apple-surface px-2 py-1 ring-1 ring-apple-border">
                <span className="text-[10px] text-apple-muted">Vel</span>
                <input
                  type="range"
                  min={1}
                  max={127}
                  value={selectedEvent.velocity}
                  onChange={(e) => setVelocity(Number(e.target.value))}
                  className="daw-range h-1 w-20 cursor-pointer"
                />
                <span className="w-6 text-right text-[10px] text-apple-text">{selectedEvent.velocity}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note grid with piano keys */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div
          ref={gridScrollRef}
          className="flex flex-1 overflow-auto"
          onScroll={() => syncScroll('grid')}
        >
          <div className="flex min-h-full">
            {/* Piano keys */}
            <div className="sticky left-0 z-10 shrink-0 border-r border-apple-border">
              {renderPianoKeys()}
            </div>

            {/* Grid + notes */}
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
              {/* Vertical grid: bars + beats + 16ths */}
              {Array.from({ length: totalBeats * 4 }).map((_, i) => {
                const isBar = i % 16 === 0;
                const isBeat = i % 4 === 0;
                return (
                  <div
                    key={`v-${i}`}
                    className={`absolute top-0 bottom-0 border-l ${
                      isBar ? 'border-apple-text/25' : isBeat ? 'border-apple-border/60' : 'border-apple-border/15'
                    }`}
                    style={{ left: i * (BEAT_WIDTH / 4) }}
                  />
                );
              })}

              {/* Horizontal grid rows with scale highlight */}
              {Array.from({ length: MAX_PITCH - MIN_PITCH + 1 }).map((_, i) => {
                const pitch = MIN_PITCH + i;
                const inScale = isInScale(pitch, keyRoot, scale);
                const black = isBlackKey(pitch);
                return (
                  <div
                    key={`h-${i}`}
                    className={`absolute left-0 right-0 border-t ${
                      black ? 'bg-black/25' : 'bg-white/[0.03]'
                    } ${inScale ? 'bg-apple-accent/[0.06]' : ''} border-apple-border/20`}
                    style={{ bottom: i * NOTE_HEIGHT, height: NOTE_HEIGHT }}
                  />
                );
              })}

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
                    className={`absolute rounded-sm border transition ${
                      isSelected
                        ? 'border-white bg-apple-accent'
                        : inScale
                        ? 'border-apple-accent/60 bg-apple-accent/80 hover:bg-apple-accent'
                        : 'border-apple-accent/40 bg-apple-accent/50 hover:bg-apple-accent/70'
                    }`}
                    style={{
                      left: evt.start * BEAT_WIDTH,
                      bottom: (evt.pitch - MIN_PITCH) * NOTE_HEIGHT,
                      height: NOTE_HEIGHT - 2,
                      width: Math.max(4, evt.duration * BEAT_WIDTH),
                      opacity: noteOpacity(evt.velocity),
                      touchAction: 'none',
                    }}
                    title={`Pitch ${evt.pitch} · start ${evt.start.toFixed(2)} · dur ${evt.duration.toFixed(2)} · vel ${evt.velocity}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Velocity lane */}
      <div
        className="flex shrink-0 border-t border-apple-border bg-apple-surface-raised"
        style={{ height: VELOCITY_LANE_HEIGHT }}
      >
        {/* Gutter */}
        <div className="flex w-[48px] shrink-0 flex-col items-center justify-center border-r border-apple-border text-[9px] text-apple-muted">
          <span>Vel</span>
        </div>
        <div
          ref={laneScrollRef}
          className="relative flex-1 overflow-x-auto overflow-y-hidden"
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
                className={`absolute top-0 bottom-0 border-l ${i % 4 === 0 ? 'border-apple-text/20' : 'border-apple-border/30'}`}
                style={{ left: i * BEAT_WIDTH }}
              />
            ))}
            {[0.25, 0.5, 0.75].map((ratio) => (
              <div
                key={`lane-line-${ratio}`}
                className="absolute left-0 right-0 border-t border-apple-border/20"
                style={{ bottom: `${ratio * VELOCITY_LANE_HEIGHT}px` }}
              />
            ))}

            {/* Velocity bars */}
            {events.map((evt, index) => {
              const isSelected = selectedId === String(index);
              const barHeight = Math.max(2, (evt.velocity / 127) * VELOCITY_LANE_HEIGHT);
              return (
                <button
                  key={`vel-${evt.pitch}-${evt.start}-${index}`}
                  type="button"
                  onPointerDown={(e) => handleVelocityPointerDown(e, index)}
                  className={`absolute bottom-0 rounded-t-sm border-t border-l border-r transition ${
                    isSelected
                      ? 'border-apple-accent bg-apple-accent'
                      : 'border-apple-accent/60 bg-apple-accent/70 hover:bg-apple-accent'
                  }`}
                  style={{
                    left: evt.start * BEAT_WIDTH,
                    width: Math.max(4, evt.duration * BEAT_WIDTH),
                    height: barHeight,
                    opacity: noteOpacity(evt.velocity),
                    touchAction: 'none',
                  }}
                  title={`Velocity ${evt.velocity}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex h-7 shrink-0 items-center border-t border-apple-border bg-apple-surface-raised px-3 text-[10px] text-apple-muted">
        <div className="w-[48px] shrink-0" />
        <div className="flex-1">
          {toolMode === 'pencil' ? 'Click grid to add' : toolMode === 'eraser' ? 'Click note to erase' : 'Click note to select · Drag to move'} · Right click to delete · Drag velocity bars · Cmd/Ctrl+Z undo/redo
        </div>
      </div>
    </div>
  );
}
