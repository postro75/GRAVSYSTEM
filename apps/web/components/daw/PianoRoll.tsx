'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Region, MidiEvent } from '@gravsystem/core';

export interface PianoRollProps {
  region: Region;
  bpm?: number;
  onChange?: (region: Region) => void;
}

const BEAT_WIDTH = 60;
const NOTE_HEIGHT = 14;
const TOTAL_BEATS = 16;
const MIN_PITCH = 36;
const MAX_PITCH = 96;

export function PianoRoll({ region, bpm = 120, onChange }: PianoRollProps) {
  const [events, setEvents] = useState<MidiEvent[]>(region.midiEvents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<MidiEvent[][]>([region.midiEvents]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const previewSynthRef = useRef<Tone.PolySynth | null>(null);
  const previewStartedRef = useRef(false);

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

  const snap = (value: number, step: number) => Math.round(value / step) * step;

  const handleAdd = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = rect.height - (e.clientY - rect.top);
    const start = Math.max(0, snap(x / BEAT_WIDTH, 0.25));
    const pitch = Math.min(MAX_PITCH, Math.max(MIN_PITCH, Math.floor(y / NOTE_HEIGHT) + MIN_PITCH));

    const newEvent: MidiEvent = {
      pitch,
      velocity: 100,
      start,
      duration: 0.25,
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
      i === index ? { ...evt, duration: Math.min(4, evt.duration + 0.25) } : evt
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
      const newStart = Math.max(0, snap(startBeat + dx / BEAT_WIDTH, 0.25));
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
  }, [commit]);

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

  return (
    <div className="flex h-full flex-col bg-apple-bg">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-apple-border px-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-apple-text">{region.name}</span>
          <span className="text-[10px] text-apple-muted">
            {bpm} BPM · click grid to add, drag notes to move
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

      <div className="relative min-h-0 flex-1 overflow-auto">
        <div
          className="relative cursor-crosshair"
          style={{
            width: TOTAL_BEATS * BEAT_WIDTH,
            height: (MAX_PITCH - MIN_PITCH + 1) * NOTE_HEIGHT,
          }}
          onClick={handleAdd}
        >
          {/* Grid */}
          {Array.from({ length: TOTAL_BEATS * 4 }).map((_, i) => (
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
            return (
              <button
                key={`${evt.pitch}-${evt.start}-${index}`}
                type="button"
                onClick={(e) => handleSelect(e, index)}
                onContextMenu={(e) => handleDelete(e, index)}
                onPointerDown={(e) => handleNotePointerDown(e, index)}
                className={`absolute rounded-sm ring-1 transition ${
                  isSelected
                    ? 'bg-apple-accent ring-white'
                    : 'bg-apple-accent/70 ring-apple-accent/50 hover:bg-apple-accent'
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

      <div className="flex h-7 shrink-0 items-center border-t border-apple-border bg-apple-surface-raised px-3 text-[10px] text-apple-muted">
        Click grid to add · Click note to select · Drag to move · Right click to delete · Cmd/Ctrl+Z undo/redo
      </div>
    </div>
  );
}
