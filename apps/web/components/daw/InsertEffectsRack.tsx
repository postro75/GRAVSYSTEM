'use client';

import { InsertEffects } from '@gravsystem/core';
import { Zap, Waves, SlidersHorizontal, Gauge, Power } from 'lucide-react';
import { Knob } from './Knob';

export interface InsertEffectsRackProps {
  effects: InsertEffects;
  onChange: (effects: InsertEffects) => void;
}

interface SlotDef {
  key: keyof InsertEffects;
  amountKey: keyof InsertEffects;
  bypassKey: keyof InsertEffects;
  label: string;
  icon: React.ElementType;
}

const SLOTS: SlotDef[] = [
  { key: 'distortion', amountKey: 'distortion', bypassKey: 'distortionBypass', label: 'Distortion', icon: Zap },
  { key: 'chorus', amountKey: 'chorus', bypassKey: 'chorusBypass', label: 'Chorus', icon: Waves },
  { key: 'eq', amountKey: 'eq', bypassKey: 'eqBypass', label: 'EQ', icon: SlidersHorizontal },
  { key: 'compressor', amountKey: 'compressor', bypassKey: 'compressorBypass', label: 'Compressor', icon: Gauge },
];

function formatPercent(value: number) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

export function InsertEffectsRack({ effects, onChange }: InsertEffectsRackProps) {
  const handleAmountChange = (key: keyof InsertEffects, value: number) => {
    onChange({ ...effects, [key]: Math.max(0, Math.min(1, value)) });
  };

  const handleBypassToggle = (key: keyof InsertEffects) => {
    onChange({ ...effects, [key]: !(effects[key] ?? false) });
  };

  return (
    <div className="space-y-2">
      {SLOTS.map(({ key, amountKey, bypassKey, label, icon: Icon }) => {
        const amount = (effects[amountKey] as number) ?? 0;
        const bypassed = (effects[bypassKey] as boolean) ?? false;
        return (
          <div
            key={key}
            className={`rounded-apple-sm border border-apple-border bg-apple-bg p-2 transition ${bypassed ? 'opacity-60' : ''}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-apple-text">
                <Icon size={12} className="text-apple-accent" />
                <span>{label}</span>
              </div>
              <button
                type="button"
                onClick={() => handleBypassToggle(bypassKey)}
                title={bypassed ? 'Enable effect' : 'Bypass effect'}
                className={`flex h-5 items-center gap-1 rounded px-1.5 text-[9px] font-semibold uppercase tracking-wide transition ${
                  bypassed
                    ? 'bg-apple-surface-raised text-apple-muted'
                    : 'bg-apple-accent/15 text-apple-accent'
                }`}
              >
                <Power size={10} />
                {bypassed ? 'Bypass' : 'Active'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <Knob
                value={amount}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => handleAmountChange(amountKey, value)}
                valueText={formatPercent(amount)}
                disabled={bypassed}
                size={44}
              />
              <div className="flex flex-col items-end gap-0.5 text-[9px] text-apple-muted">
                <span className="uppercase tracking-wide">Amount</span>
                <span className="tabular-nums text-apple-text">{formatPercent(amount)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
