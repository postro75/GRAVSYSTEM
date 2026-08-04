'use client';

import { useMemo } from 'react';
import { Region } from '@gravsystem/core';
import { diatonicChords, Scale } from '@/lib/music-theory';

export interface ChordPadProps {
  keyRoot?: string;
  scale?: Scale;
  selectedRegion?: Region | null;
  onChange?: (region: Region) => void;
  onPreview?: (notes: number[]) => void;
}

export function ChordPad({
  keyRoot = 'C',
  scale = 'minor',
  selectedRegion,
  onChange,
  onPreview,
}: ChordPadProps) {
  const chords = useMemo(() => diatonicChords(keyRoot, scale, 4), [keyRoot, scale]);

  const insertChord = (notes: number[]) => {
    if (!selectedRegion) return;

    const start = selectedRegion.midiEvents.length > 0
      ? Math.max(...selectedRegion.midiEvents.map((e) => e.start + e.duration))
      : 0;
    const duration = 1; // one beat stab

    const newEvents = notes.map((pitch) => ({
      pitch,
      velocity: 100,
      start,
      duration,
    }));

    onChange?.({
      ...selectedRegion,
      midiEvents: [...selectedRegion.midiEvents, ...newEvents],
      duration: Math.max(selectedRegion.duration, start + duration),
    });
  };

  return (
    <div className="flex h-full flex-col bg-apple-bg p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-semibold text-apple-text">Chord Pad</div>
        <div className="text-[10px] text-apple-muted">
          {keyRoot} {scale} · click to insert
        </div>
      </div>

      {!selectedRegion && (
        <div className="flex flex-1 items-center justify-center text-xs text-apple-muted">
          Select a region to insert chords.
        </div>
      )}

      {selectedRegion && (
        <div className="grid grid-cols-7 gap-2">
          {chords.map((chord) => (
            <button
              key={chord.degree}
              type="button"
              onClick={() => insertChord(chord.notes)}
              onMouseEnter={() => onPreview?.(chord.notes)}
              className="flex flex-col items-center justify-center rounded-apple-sm border border-apple-border bg-apple-surface py-3 text-xs transition hover:border-apple-accent hover:bg-apple-accent/10"
            >
              <span className="font-semibold text-apple-text">{chord.roman}</span>
              <span className="text-[10px] text-apple-muted">{chord.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 text-[10px] text-apple-muted">
        Hover to preview · Click to append at the end of the selected region.
      </div>
    </div>
  );
}
