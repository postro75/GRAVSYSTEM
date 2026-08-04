'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import {
  INSTRUMENTS,
  INSTRUMENT_CATEGORIES,
  type InstrumentDefinition,
} from '@/lib/instruments';

export interface InstrumentPickerProps {
  selectedInstrumentId?: string | null;
  onSelect: (instrumentId: string) => void;
  onPreview?: (instrumentId: string) => void;
}

export function InstrumentPicker({
  selectedInstrumentId,
  onSelect,
  onPreview,
}: InstrumentPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? INSTRUMENTS.filter(
        (inst) =>
          inst.name.toLowerCase().includes(query.toLowerCase()) ||
          INSTRUMENT_CATEGORIES[inst.category].toLowerCase().includes(query.toLowerCase())
      )
    : INSTRUMENTS;

  const grouped = filtered.reduce<Record<string, InstrumentDefinition[]>>((acc, inst) => {
    const cat = INSTRUMENT_CATEGORIES[inst.category];
    acc[cat] = acc[cat] ?? [];
    acc[cat].push(inst);
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col bg-apple-bg">
      <div className="flex h-9 items-center gap-2 border-b border-apple-border bg-apple-surface-raised px-3">
        <Search size={14} className="text-apple-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search instruments..."
          className="flex-1 bg-transparent text-xs text-apple-text placeholder:text-apple-muted focus:outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {Object.entries(grouped).map(([category, instruments]) => (
          <div key={category} className="mb-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-apple-muted">
              {category}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {instruments.map((inst) => {
                const isSelected = selectedInstrumentId === inst.id;
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => onSelect(inst.id)}
                    onMouseEnter={() => onPreview?.(inst.id)}
                    className={`flex items-center gap-2 rounded-apple-sm border px-2 py-1.5 text-left text-xs transition ${
                      isSelected
                        ? 'border-apple-accent bg-apple-accent/10 text-apple-accent'
                        : 'border-apple-border bg-apple-surface text-apple-text hover:bg-apple-surface-raised'
                    }`}
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: inst.color }}
                    />
                    <span className="truncate">{inst.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-8 text-center text-xs text-apple-muted">No instruments found</div>
        )}
      </div>
    </div>
  );
}
