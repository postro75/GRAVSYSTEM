'use client';

import { useEffect, useState } from 'react';
import { InstrumentParams, DEFAULT_INSTRUMENT_PARAMS } from '@gravsystem/core';
import type { InstrumentDefinition } from '@/lib/instruments';
import { formatParamValue } from '@/lib/instrument-params';
import { SlidersHorizontal } from 'lucide-react';

interface SliderDef {
  key: keyof InstrumentParams;
  label: string;
  tip: string;
  min: number;
  max: number;
  step: number;
}

const BASE_SLIDERS: SliderDef[] = [
  { key: 'attack', label: 'Attack', tip: 'How quickly the sound starts.', min: 0, max: 2000, step: 5 },
  { key: 'decay', label: 'Decay', tip: 'How quickly the sound falls to the sustain level.', min: 0, max: 2000, step: 5 },
  { key: 'sustain', label: 'Sustain', tip: 'Level held while a note is held.', min: 0, max: 100, step: 1 },
  { key: 'release', label: 'Release', tip: 'How quickly the sound fades after the note ends.', min: 0, max: 5000, step: 10 },
  { key: 'cutoff', label: 'Filter Cutoff', tip: 'Brightness/darkness of the low-pass filter.', min: 20, max: 20000, step: 10 },
  { key: 'resonance', label: 'Resonance', tip: 'Emphasis around the filter cutoff frequency.', min: 0, max: 20, step: 0.1 },
  { key: 'reverb', label: 'Reverb Send', tip: 'Amount of hall/space effect.', min: 0, max: 100, step: 1 },
  { key: 'delay', label: 'Delay Send', tip: 'Amount of echo/repeat effect.', min: 0, max: 100, step: 1 },
];

const CATEGORY_LABELS: Partial<
  Record<InstrumentDefinition['category'], Partial<Record<keyof InstrumentParams, string>>>
> = {
  bass: {
    attack: 'Punch',
    cutoff: 'Growl',
    resonance: 'Bite',
    reverb: 'Space',
    delay: 'Width',
  },
  lead: {
    cutoff: 'Brightness',
    resonance: 'Bite',
    reverb: 'Space',
    delay: 'Echo',
  },
  pad: {
    attack: 'Swell',
    cutoff: 'Darkness',
    resonance: 'Air',
    reverb: 'Hall',
    delay: 'Width',
  },
  arp: {
    decay: 'Pluck',
    delay: 'Echo',
  },
  chords: {
    cutoff: 'Body',
    resonance: 'Sparkle',
    reverb: 'Hall',
    delay: 'Width',
  },
  drums: {
    attack: 'Punch',
    decay: 'Decay',
    reverb: 'Room',
    delay: 'Echo',
  },
};

function getSlidersForCategory(category?: InstrumentDefinition['category']): SliderDef[] {
  const labels = category ? CATEGORY_LABELS[category] : undefined;
  return BASE_SLIDERS.map((def) => ({
    ...def,
    label: labels?.[def.key] ?? def.label,
  }));
}

export interface InstrumentMacroEditorProps {
  params?: InstrumentParams;
  category?: InstrumentDefinition['category'];
  onChange?: (params: InstrumentParams) => void;
}

function toSliderValue(key: keyof InstrumentParams, value: number): number {
  if (key === 'attack' || key === 'decay' || key === 'release') return value * 1000;
  if (key === 'sustain' || key === 'reverb' || key === 'delay') return value * 100;
  return value;
}

function fromSliderValue(key: keyof InstrumentParams, value: number): number {
  if (key === 'attack' || key === 'decay' || key === 'release') return value / 1000;
  if (key === 'sustain' || key === 'reverb' || key === 'delay') return value / 100;
  return value;
}

export function InstrumentMacroEditor({ params, category, onChange }: InstrumentMacroEditorProps) {
  const current = params ?? DEFAULT_INSTRUMENT_PARAMS;
  const [local, setLocal] = useState(current);
  const sliders = getSlidersForCategory(category);

  useEffect(() => {
    setLocal(current);
  }, [current]);

  const updateKey = (key: keyof InstrumentParams, sliderValue: number) => {
    const next = { ...local, [key]: fromSliderValue(key, sliderValue) };
    setLocal(next);
    onChange?.(next);
  };

  const reset = () => {
    setLocal(DEFAULT_INSTRUMENT_PARAMS);
    onChange?.(DEFAULT_INSTRUMENT_PARAMS);
  };

  const renderSlider = (def: SliderDef) => {
    const value = toSliderValue(def.key, local[def.key]);
    return (
      <div key={def.key} className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px] text-apple-muted" title={def.tip}>
          <span className="cursor-help underline decoration-dotted underline-offset-2">{def.label}</span>
          <span className="tabular-nums">{formatParamValue(def.key, local[def.key])}</span>
        </div>
        <input
          type="range"
          min={def.min}
          max={def.max}
          step={def.step}
          value={value}
          onChange={(e) => updateKey(def.key, Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded bg-apple-border accent-apple-accent"
        />
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col rounded-apple-sm border border-apple-border bg-apple-bg">
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-apple-border px-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-apple-text">
          <SlidersHorizontal size={12} />
          Macros
          {category && (
            <span className="rounded bg-apple-surface-raised px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-apple-muted">
              {category}
            </span>
          )}
        </div>
        <button
          onClick={reset}
          className="text-[10px] text-apple-muted transition hover:text-apple-accent"
        >
          Reset
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-apple-muted">
            Envelope
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sliders.filter((s) => ['attack', 'decay', 'sustain', 'release'].includes(s.key)).map(renderSlider)}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-apple-muted">
            Tone & FX
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sliders.filter((s) => ['cutoff', 'resonance', 'reverb', 'delay'].includes(s.key)).map(renderSlider)}
          </div>
        </div>
      </div>
    </div>
  );
}
