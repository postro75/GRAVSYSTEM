'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Region, MidiEvent } from '@gravsystem/core';

export interface PianoRollProps {
  region: Region;
  bpm?: number;
  onChange?: (region: Region) => void;
  onClose?: () => void;
}

const BEAT_WIDTH = 60;
const NOTE_HEIGHT = 16;
const TOTAL_BEATS = 16;
const MIN_PITCH = 36;
const MAX_PITCH = 96;

export function PianoRoll({ region, bpm = 120, onChange, onClose }: PianoRollProps) {
  const [events, setEvents] = useState<MidiEvent[]>(region.midiEvents);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setEvents(region.midiEvents);
  }, [region]);

  const commit = useCallback(
    (next: MidiEvent[]) => {
      setEvents(next);
      onChange?.({ ...region, midiEvents: next });
    },
    [onChange, region]
  );

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-8 backdrop-blur-sm">
      <div className="flex h-full max-h-[80vh] w-full max-w-5xl flex-col rounded-2xl border border-white/10 bg-apple-bg shadow-apple">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <h3 className="text-base font-semibold text-apple-text">Piano Roll</h3>
            <p className="text-xs text-apple-muted">
              {region.name} · {bpm} BPM · click grid to add, drag notes to move
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={extendDuration}
              className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-apple-text hover:bg-white/10 disabled:opacity-40"
              disabled={selectedId === null}
            >
              Extend note
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-apple-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-apple-accent/90"
            >
              Close
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-auto">
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
                  className={`absolute h-4 rounded-sm ring-1 transition ${
                    isSelected
                      ? 'bg-apple-accent ring-white'
                      : 'bg-apple-accent/70 ring-apple-accent/50 hover:bg-apple-accent'
                  }`}
                  style={{
                    left: evt.start * BEAT_WIDTH,
                    bottom: (evt.pitch - MIN_PITCH) * NOTE_HEIGHT,
                    width: Math.max(4, evt.duration * BEAT_WIDTH),
                    touchAction: 'none',
                  }}
                  title={`Pitch ${evt.pitch} · start ${evt.start.toFixed(2)} · dur ${evt.duration.toFixed(2)}`}
                />
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-2 text-xs text-apple-muted">
          Left click grid to add · Left click note to select · Drag to move · Right click to delete
        </div>
      </div>
    </div>
  );
}
