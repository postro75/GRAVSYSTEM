'use client';

import { useEffect, useState } from 'react';
import { InstrumentParams, DEFAULT_INSTRUMENT_PARAMS } from '@gravsystem/core';
import { formatParamValue } from '@/lib/instrument-params';
import { SlidersHorizontal } from 'lucide-react';

interface SliderDef {
  key: keyof InstrumentParams;
  label: string;
  min: number;
  max: number;
  step: number;
}

const ENVELOPE_SLIDERS: SliderDef[] = [
  { key: 'attack', label: 'Attack', min: 0, max: 2000, step: 5 },
  { key: 'decay', label: 'Decay', min: 0, max: 2000, step: 5 },
  { key: 'sustain', label: 'Sustain', min: 0, max: 100, step: 1 },
  { key: 'release', label: 'Release', min: 0, max: 5000, step: 10 },
];

const TONE_SLIDERS: SliderDef[] = [
  { key: 'cutoff', label: 'Filter Cutoff', min: 20, max: 20000, step: 10 },
  { key: 'resonance', label: 'Resonance', min: 0, max: 20, step: 0.1 },
  { key: 'reverb', label: 'Reverb Send', min: 0, max: 100, step: 1 },
  { key: 'delay', label: 'Delay Send', min: 0, max: 100, step: 1 },
];

export interface InstrumentMacroEditorProps {
  params?: InstrumentParams;
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

export function InstrumentMacroEditor({ params, onChange }: InstrumentMacroEditorProps) {
  const current = params ?? DEFAULT_INSTRUMENT_PARAMS;
  const [local, setLocal] = useState(current);

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
        <div className="flex items-center justify-between text-[10px] text-apple-muted">
          <span>{def.label}</span>
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
          <div className="grid grid-cols-2 gap-3">{ENVELOPE_SLIDERS.map(renderSlider)}</div>
        </div>
        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-apple-muted">
            Tone & FX
          </div>
          <div className="grid grid-cols-2 gap-3">{TONE_SLIDERS.map(renderSlider)}</div>
        </div>
      </div>
    </div>
  );
}
