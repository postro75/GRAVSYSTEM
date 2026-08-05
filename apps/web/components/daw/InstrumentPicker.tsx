'use client';

import { useMemo, useState } from 'react';
import { Search, Drum, Guitar, Music2, AudioLines, Layers, Keyboard, Waves, Sparkles, Check } from 'lucide-react';
import {
  INSTRUMENTS,
  INSTRUMENT_CATEGORIES,
  STYLE_INSTRUMENT_PALETTE,
  type InstrumentDefinition,
} from '@/lib/instruments';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Bass: <Guitar size={14} />,
  Lead: <Music2 size={14} />,
  Pads: <Layers size={14} />,
  Arpeggios: <AudioLines size={14} />,
  'Chords / Stabs': <Waves size={14} />,
  Drums: <Drum size={14} />,
  Keys: <Keyboard size={14} />,
  Strings: <Layers size={14} />,
  FX: <Sparkles size={14} />,
};

const STYLE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'jarre', label: 'Jarre / Ambient' },
  { key: 'synthwave', label: 'Synthwave' },
  { key: 'dance', label: 'Dance / EDM' },
  { key: 'techno', label: 'Techno' },
];

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
  const [styleFilter, setStyleFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = INSTRUMENTS;

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (inst) =>
          inst.name.toLowerCase().includes(q) ||
          INSTRUMENT_CATEGORIES[inst.category].toLowerCase().includes(q) ||
          inst.description?.toLowerCase().includes(q)
      );
    }

    if (styleFilter !== 'all') {
      const stylePalette = STYLE_INSTRUMENT_PALETTE[styleFilter] ?? {};
      const allowed = new Set(Object.values(stylePalette).flat());
      list = list.filter((inst) => allowed.has(inst.id) || inst.type === 'drums' || inst.type === 'soundfont');
    }

    return list;
  }, [query, styleFilter]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, InstrumentDefinition[]>>((acc, inst) => {
      const cat = INSTRUMENT_CATEGORIES[inst.category];
      acc[cat] = acc[cat] ?? [];
      acc[cat].push(inst);
      return acc;
    }, {});
  }, [filtered]);

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

      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-apple-border px-2 py-2">
        {STYLE_FILTERS.map((sf) => (
          <button
            key={sf.key}
            type="button"
            onClick={() => setStyleFilter(sf.key)}
            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
              styleFilter === sf.key
                ? 'bg-apple-accent text-white'
                : 'bg-apple-surface text-apple-text hover:bg-apple-surface-raised'
            }`}
          >
            {sf.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {Object.entries(grouped).map(([category, instruments]) => (
          <div key={category} className="mb-4">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-apple-muted">
              <span className="text-apple-accent">{CATEGORY_ICONS[category]}</span>
              {category}
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {instruments.map((inst) => {
                const isSelected = selectedInstrumentId === inst.id;
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => onSelect(inst.id)}
                    onMouseEnter={() => onPreview?.(inst.id)}
                    className={`group flex items-center gap-3 rounded-apple-sm border px-2.5 py-2 text-left transition ${
                      isSelected
                        ? 'border-apple-accent bg-apple-accent/10 text-apple-accent'
                        : 'border-apple-border bg-apple-surface text-apple-text hover:bg-apple-surface-raised'
                    }`}
                  >
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/10"
                      style={{ backgroundColor: inst.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        {inst.name}
                        {isSelected && <Check size={12} className="text-apple-accent" />}
                      </div>
                      {inst.description && (
                        <div className="truncate text-[10px] text-apple-muted">{inst.description}</div>
                      )}
                    </div>
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
