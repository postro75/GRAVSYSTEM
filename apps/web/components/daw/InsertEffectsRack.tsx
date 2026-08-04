'use client';

import { InsertEffects } from '@gravsystem/core';
import { SlidersVertical } from 'lucide-react';

export interface InsertEffectsRackProps {
  effects: InsertEffects;
  onChange: (effects: InsertEffects) => void;
}

const KNOBS: { key: keyof InsertEffects; label: string }[] = [
  { key: 'distortion', label: 'Distortion' },
  { key: 'chorus', label: 'Chorus' },
  { key: 'eq', label: 'EQ' },
  { key: 'compressor', label: 'Compressor' },
];

export function InsertEffectsRack({ effects, onChange }: InsertEffectsRackProps) {
  const handleChange = (key: keyof InsertEffects, value: number) => {
    onChange({ ...effects, [key]: Math.max(0, Math.min(1, value)) });
  };

  return (
    <div className="flex h-64 flex-col rounded-apple-sm border border-apple-border bg-apple-bg">
      <div className="flex h-8 items-center gap-2 border-b border-apple-border px-3 text-xs font-semibold text-apple-text">
        <SlidersVertical size={12} />
        Insert Effects
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {KNOBS.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-apple-muted">
              <span>{label}</span>
              <span>{Math.round((effects[key] ?? 0) * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={effects[key] ?? 0}
              onChange={(e) => handleChange(key, parseFloat(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded bg-apple-border accent-apple-accent"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
