'use client';

import { useMemo } from 'react';
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

export function StepSequencer({ selectedRegion, currentStep = -1, onChange }: StepSequencerProps) {
  const grid = useMemo(() => {
    const map: Record<number, boolean[]> = {};
    for (const row of ROWS) {
      map[row.note] = Array.from({ length: STEPS }, () => false);
    }
    if (selectedRegion) {
      for (const evt of selectedRegion.midiEvents) {
        const step = Math.round(evt.start * 4);
        if (step >= 0 && step < STEPS && map[evt.pitch]) {
          map[evt.pitch][step] = true;
        }
      }
    }
    return map;
  }, [selectedRegion]);

  const toggleStep = (note: number, step: number) => {
    if (!selectedRegion) return;

    const nextEvents = selectedRegion.midiEvents.filter((evt) => {
      const evtStep = Math.round(evt.start * 4);
      return !(evt.pitch === note && evtStep === step);
    });

    if (!grid[note][step]) {
      nextEvents.push({
        pitch: note,
        velocity: 100,
        start: step / 4,
        duration: 0.25,
      });
    }

    onChange?.({
      ...selectedRegion,
      midiEvents: nextEvents.sort((a, b) => a.start - b.start),
    });
  };

  if (!selectedRegion) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-apple-muted">
        Select a drum region to edit steps.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-apple-bg p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold text-apple-text">Step Sequencer</div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4].map((beat) => (
            <div key={beat} className="flex w-16 justify-center text-[9px] text-apple-muted">
              {beat}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {ROWS.map((row) => (
          <div key={row.note} className="flex items-center gap-2">
            <div className="w-20 shrink-0 text-[10px] font-medium text-apple-muted">{row.label}</div>
            <div className="flex flex-1 gap-0.5">
              {grid[row.note].map((active, step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => toggleStep(row.note, step)}
                  className={`h-8 flex-1 rounded-sm border transition ${
                    active
                      ? 'border-apple-accent bg-apple-accent shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                      : 'border-apple-border bg-apple-surface hover:bg-apple-surface-raised'
                  } ${step % 4 === 0 ? 'opacity-100' : 'opacity-60'} ${
                    currentStep === step ? 'ring-1 ring-white' : ''
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-[10px] text-apple-muted">
        Click steps to toggle. Each number = one beat. 16 steps = 4 beats.
      </div>
    </div>
  );
}
