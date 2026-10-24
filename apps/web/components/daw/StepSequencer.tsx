'use client';

import { useMemo, useRef, useCallback } from 'react';
import { Region } from '@gravsystem/core';
import { DRUM_NOTES } from '@/lib/drum-kit';

export interface StepSequencerProps {
  selectedRegion?: Region | null;
  currentStep?: number;
  onChange?: (region: Region) => void;
}

const ROWS: { label: string; note: number }[] = [
  { label: 'Kick', note: DRUM_NOTES.kick },
  { label: 'Snare', note: DRUM_NOTES.snare },
  { label: 'Hi-Hat', note: DRUM_NOTES.hihatClosed },
  { label: 'Open Hat', note: DRUM_NOTES.hihatOpen },
];

const STEPS = 16;
const VELOCITY_LEVELS = [60, 100, 127];

export function StepSequencer({ selectedRegion, currentStep = -1, onChange }: StepSequencerProps) {
  const dragRef = useRef<{ note: number; step: number; wasActive: boolean } | null>(null);

  const grid = useMemo(() => {
    const map: Record<number, number[]> = {};
    for (const row of ROWS) {
      map[row.note] = Array.from({ length: STEPS }, () => 0);
    }
    if (selectedRegion) {
      for (const evt of selectedRegion.midiEvents) {
        const step = Math.round(evt.start * 4);
        if (step >= 0 && step < STEPS && map[evt.pitch]) {
          map[evt.pitch][step] = evt.velocity;
        }
      }
    }
    return map;
  }, [selectedRegion]);

  const commit = useCallback(
    (nextGrid: Record<number, number[]>) => {
      if (!selectedRegion) return;

      const events = [];
      for (const row of ROWS) {
        for (let step = 0; step < STEPS; step++) {
          const velocity = nextGrid[row.note][step];
          if (velocity > 0) {
            events.push({
              pitch: row.note,
              velocity,
              start: step / 4,
              duration: 0.25,
            });
          }
        }
      }

      onChange?.({
        ...selectedRegion,
        midiEvents: events.sort((a, b) => a.start - b.start),
      });
    },
    [selectedRegion, onChange]
  );

  const setStep = (note: number, step: number, velocity: number) => {
    const next = { ...grid, [note]: [...grid[note]] };
    next[note][step] = velocity;
    commit(next);
  };

  const toggleStep = (note: number, step: number) => {
    const current = grid[note][step];
    if (current === 0) {
      setStep(note, step, 100);
    } else {
      setStep(note, step, 0);
    }
  };

  const cycleVelocity = (note: number, step: number) => {
    const current = grid[note][step];
    if (current === 0) {
      setStep(note, step, VELOCITY_LEVELS[0]);
      return;
    }
    const idx = VELOCITY_LEVELS.findIndex((v) => v >= current);
    const nextIdx = (idx + 1) % VELOCITY_LEVELS.length;
    if (nextIdx === idx) {
      setStep(note, step, 0);
    } else {
      setStep(note, step, VELOCITY_LEVELS[nextIdx]);
    }
  };

  const handlePointerDown = (note: number, step: number) => {
    const wasActive = grid[note][step] > 0;
    dragRef.current = { note, step, wasActive };
    toggleStep(note, step);
  };

  const handlePointerEnter = (note: number, step: number) => {
    if (!dragRef.current) return;
    if (dragRef.current.note !== note) return;
    const targetActive = !dragRef.current.wasActive;
    const currentActive = grid[note][step] > 0;
    if (currentActive !== targetActive) {
      setStep(note, step, targetActive ? 100 : 0);
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  if (!selectedRegion) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-apple-muted">
        Select a drum region to edit steps.
      </div>
    );
  }

  return (
    <div
      className="flex h-full select-none flex-col bg-apple-bg p-4"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-semibold text-apple-text">Step Sequencer</div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((beat) => (
            <div key={beat} className="flex w-20 justify-center text-[10px] text-apple-muted">
              {beat}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {ROWS.map((row) => (
          <div key={row.note} className="flex items-center gap-3">
            <div className="w-20 shrink-0 text-xs font-medium text-apple-text">{row.label}</div>
            <div className="flex flex-1 gap-1">
              {grid[row.note].map((velocity, step) => {
                const active = velocity > 0;
                const intensity = active ? Math.min(1, velocity / 127 + 0.25) : 0;
                const isCurrent = currentStep === step;
                return (
                  <button
                    key={step}
                    type="button"
                    onPointerDown={() => handlePointerDown(row.note, step)}
                    onPointerEnter={() => handlePointerEnter(row.note, step)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      cycleVelocity(row.note, step);
                    }}
                    className={`h-10 flex-1 rounded border transition ${
                      active
                        ? 'border-apple-accent bg-apple-accent'
                        : 'border-apple-border bg-apple-surface hover:bg-apple-surface-raised'
                    } ${step % 4 === 0 ? 'opacity-100' : 'opacity-70'} ${
                      isCurrent ? 'ring-2 ring-white' : ''
                    }`}
                    style={active ? { opacity: intensity } : undefined}
                    title={active ? `Velocity ${velocity}` : 'Empty'}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-[10px] text-apple-muted">
        <span>Click / drag to toggle steps.</span>
        <span>Right-click step to cycle velocity.</span>
      </div>
    </div>
  );
}
