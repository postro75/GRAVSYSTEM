'use client';

import { useMemo, useRef, useCallback, useState } from 'react';
import { Track, Region, MidiEvent } from '@gravsystem/core';
import { DRUM_NOTES } from '@/lib/drum-kit';

export interface DrumStepSequencerProps {
  track: Track;
  region: Region;
  bars?: number;
  bpm?: number;
  key?: string;
  scale?: 'major' | 'minor';
  onRegionChange?: (region: Region) => void;
  onPreviewNote?: (pitch: number, velocity?: number) => void;
}

interface StepCell {
  velocity: number;
  probability: number;
}

const ROWS: { label: string; note: number }[] = [
  { label: 'Kick', note: DRUM_NOTES.kick },
  { label: 'Snare', note: DRUM_NOTES.snare },
  { label: 'Clap', note: DRUM_NOTES.clap },
  { label: 'Closed Hat', note: DRUM_NOTES.hihatClosed },
  { label: 'Open Hat', note: DRUM_NOTES.hihatOpen },
  { label: 'Perc', note: 50 },
];

const DEFAULT_STEPS = 16;
const MAX_STEPS = 32;
const VELOCITY_LEVELS = [0, 40, 72, 100, 127];
const PROBABILITY_LEVELS = [0, 25, 50, 75, 100];

type EditMode = 'toggle' | 'velocity' | 'probability';

function velocityToHeight(velocity: number) {
  return Math.max(0.15, velocity / 127);
}

function velocityToBrightness(velocity: number) {
  return 0.35 + (velocity / 127) * 0.65;
}

export function DrumStepSequencer({
  region,
  onRegionChange,
  onPreviewNote,
}: DrumStepSequencerProps) {
  const [stepCount, setStepCount] = useState(() => {
    const auto = Math.round(region.duration * 4);
    if (auto >= 24) return 32;
    return DEFAULT_STEPS;
  });
  const steps = Math.min(MAX_STEPS, Math.max(DEFAULT_STEPS, stepCount));

  // Probability is kept as UI-only state keyed by `${note}-${step}`.
  // It is lost when the component unmounts but satisfies the "nice to have" requirement.
  const [probabilities, setProbabilities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const row of ROWS) {
      for (let s = 0; s < steps; s++) {
        initial[`${row.note}-${s}`] = 100;
      }
    }
    return initial;
  });

  const [editMode, setEditMode] = useState<EditMode>('toggle');
  const dragRef = useRef<{
    note: number;
    step: number;
    wasActive: boolean;
    wasValue: number;
    mode: EditMode;
  } | null>(null);

  const grid = useMemo<Record<number, StepCell[]>>(() => {
    const map: Record<number, StepCell[]> = {};
    for (const row of ROWS) {
      map[row.note] = Array.from({ length: steps }, (_, s) => ({
        velocity: 0,
        probability: probabilities[`${row.note}-${s}`] ?? 100,
      }));
    }
    for (const evt of region.midiEvents) {
      const step = Math.round(evt.start * 4);
      if (step >= 0 && step < steps && map[evt.pitch]) {
        map[evt.pitch][step] = {
          velocity: evt.velocity,
          probability: probabilities[`${evt.pitch}-${step}`] ?? 100,
        };
      }
    }
    return map;
  }, [region, steps, probabilities]);

  const commit = useCallback(
    (nextGrid: Record<number, StepCell[]>) => {
      const events: MidiEvent[] = [];
      for (const row of ROWS) {
        for (let step = 0; step < steps; step++) {
          const cell = nextGrid[row.note][step];
          if (cell.velocity > 0) {
            events.push({
              pitch: row.note,
              velocity: Math.max(1, Math.min(127, Math.round(cell.velocity))),
              start: step / 4,
              duration: 0.25,
            });
          }
        }
      }
      onRegionChange?.({
        ...region,
        midiEvents: events.sort((a, b) => a.start - b.start),
      });
    },
    [region, steps, onRegionChange]
  );

  const setStep = (note: number, step: number, cell: StepCell) => {
    const next = {
      ...grid,
      [note]: [...grid[note]],
    };
    next[note][step] = cell;
    commit(next);
  };

  const cycleVelocity = (note: number, step: number) => {
    const current = grid[note][step].velocity;
    const idx = VELOCITY_LEVELS.findIndex((v) => v >= current);
    const nextIdx = idx === -1 ? 1 : (idx + 1) % VELOCITY_LEVELS.length;
    const nextVelocity = VELOCITY_LEVELS[nextIdx];
    if (nextVelocity === 0) {
      setStep(note, step, { velocity: 0, probability: probabilities[`${note}-${step}`] ?? 100 });
    } else {
      setStep(note, step, { velocity: nextVelocity, probability: probabilities[`${note}-${step}`] ?? 100 });
      onPreviewNote?.(note, nextVelocity);
    }
  };

  const cycleProbability = (note: number, step: number) => {
    const key = `${note}-${step}`;
    const current = probabilities[key] ?? 100;
    const idx = PROBABILITY_LEVELS.findIndex((p) => p >= current);
    const nextIdx = idx === -1 ? 1 : (idx + 1) % PROBABILITY_LEVELS.length;
    const nextProbability = PROBABILITY_LEVELS[nextIdx];
    setProbabilities((prev) => ({ ...prev, [key]: nextProbability }));
    if (grid[note][step].velocity > 0) {
      setStep(note, step, { velocity: grid[note][step].velocity, probability: nextProbability });
    }
  };

  const handlePointerDown = (
    e: React.PointerEvent,
    note: number,
    step: number
  ) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const cell = grid[note][step];
    const wasActive = cell.velocity > 0;

    let mode: EditMode = 'toggle';
    if (e.button === 2 || e.shiftKey) {
      mode = 'velocity';
    } else if (e.altKey || e.metaKey) {
      mode = 'probability';
    } else if (editMode !== 'toggle') {
      mode = editMode;
    }

    dragRef.current = {
      note,
      step,
      wasActive,
      wasValue: cell.velocity,
      mode,
    };

    if (mode === 'toggle') {
      const nextVelocity = wasActive ? 0 : 100;
      setStep(note, step, {
        velocity: nextVelocity,
        probability: probabilities[`${note}-${step}`] ?? 100,
      });
      if (nextVelocity > 0) {
        onPreviewNote?.(note, nextVelocity);
      }
    } else if (mode === 'velocity') {
      cycleVelocity(note, step);
    } else if (mode === 'probability') {
      cycleProbability(note, step);
    }
  };

  const handlePointerEnter = (note: number, step: number) => {
    if (!dragRef.current) return;
    if (dragRef.current.note !== note) return;
    if (dragRef.current.mode !== 'toggle') return;

    const targetActive = !dragRef.current.wasActive;
    const currentActive = grid[note][step].velocity > 0;
    if (currentActive !== targetActive) {
      const nextVelocity = targetActive ? 100 : 0;
      setStep(note, step, {
        velocity: nextVelocity,
        probability: probabilities[`${note}-${step}`] ?? 100,
      });
      if (nextVelocity > 0) {
        onPreviewNote?.(note, nextVelocity);
      }
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleContextMenu = (e: React.MouseEvent, note: number, step: number) => {
    e.preventDefault();
    cycleVelocity(note, step);
  };

  return (
    <div
      className="flex h-full select-none flex-col bg-apple-bg p-4"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-apple-text">Drum Step Sequencer</div>
          <div className="flex items-center gap-1 rounded-md bg-apple-surface-raised p-0.5">
            <button
              type="button"
              onClick={() => setEditMode('toggle')}
              className={`rounded px-2 py-1 text-[10px] font-medium transition ${
                editMode === 'toggle'
                  ? 'bg-apple-accent text-white'
                  : 'text-apple-muted hover:text-apple-text'
              }`}
            >
              Paint
            </button>
            <button
              type="button"
              onClick={() => setEditMode('velocity')}
              className={`rounded px-2 py-1 text-[10px] font-medium transition ${
                editMode === 'velocity'
                  ? 'bg-apple-accent text-white'
                  : 'text-apple-muted hover:text-apple-text'
              }`}
            >
              Velocity
            </button>
            <button
              type="button"
              onClick={() => setEditMode('probability')}
              className={`rounded px-2 py-1 text-[10px] font-medium transition ${
                editMode === 'probability'
                  ? 'bg-apple-accent text-white'
                  : 'text-apple-muted hover:text-apple-text'
              }`}
            >
              Prob
            </button>
          </div>
          <div className="flex items-center gap-1 rounded-md bg-apple-surface-raised p-0.5">
            {[16, 32].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStepCount(n)}
                className={`rounded px-2 py-1 text-[10px] font-medium transition ${
                  steps === n
                    ? 'bg-apple-surface text-apple-text'
                    : 'text-apple-muted hover:text-apple-text'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: steps / 4 }).map((_, beatGroup) => (
            <div
              key={beatGroup}
              className="flex w-20 justify-center text-[10px] text-apple-muted"
            >
              {beatGroup + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 overflow-auto">
        {ROWS.map((row) => (
          <div key={row.note} className="flex items-center gap-3">
            <div className="w-20 shrink-0 text-xs font-medium text-apple-text">{row.label}</div>
            <div className="flex flex-1 gap-0.5">
              {grid[row.note].map((cell, step) => {
                const active = cell.velocity > 0;
                const intensity = active ? velocityToBrightness(cell.velocity) : 0;
                const height = active ? velocityToHeight(cell.velocity) : 0.35;
                const isBeat = step % 4 === 0;
                const prob = cell.probability;
                const probLow = active && prob < 100;
                return (
                  <button
                    key={step}
                    type="button"
                    onPointerDown={(e) => handlePointerDown(e, row.note, step)}
                    onPointerEnter={() => handlePointerEnter(row.note, step)}
                    onContextMenu={(e) => handleContextMenu(e, row.note, step)}
                    className={`relative h-10 flex-1 rounded border transition ${
                      active
                        ? 'border-apple-accent bg-apple-accent'
                        : 'border-apple-border bg-apple-surface hover:bg-apple-surface-raised'
                    } ${isBeat ? 'opacity-100' : 'opacity-80'}`}
                    title={
                      active
                        ? `${row.label} step ${step + 1} · velocity ${cell.velocity} · probability ${prob}%`
                        : `${row.label} step ${step + 1}`
                    }
                  >
                    {active && (
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-b bg-white/90 transition-all"
                        style={{
                          height: `${height * 100}%`,
                          opacity: intensity,
                        }}
                      />
                    )}
                    {probLow && (
                      <div className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-apple-warning" />
                    )}
                    {editMode === 'probability' && active && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[8px] font-semibold text-white">
                        {prob}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-apple-muted">
        <div className="flex gap-4">
          <span>Click / drag to paint steps.</span>
          <span>Right-click or Shift+click to cycle velocity.</span>
          <span>Alt+click or Prob mode to set probability.</span>
        </div>
        <div>
          {region.name} · {region.midiEvents.length} notes
        </div>
      </div>
    </div>
  );
}
