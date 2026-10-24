'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import {
  Search,
  Drum,
  Guitar,
  Music2,
  AudioLines,
  Layers,
  Keyboard,
  Waves,
  Sparkles,
  Check,
  ChevronDown,
  X,
} from 'lucide-react';
import {
  INSTRUMENTS,
  INSTRUMENT_CATEGORIES,
  STYLE_INSTRUMENT_PALETTE,
  getInstrumentById,
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
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [styleFilter, setStyleFilter] = useState('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = getInstrumentById(selectedInstrumentId ?? '');

  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

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

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setQuery('');
    setStyleFilter('all');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex w-full items-center justify-between gap-2 rounded-apple-sm border px-2.5 py-2 text-left text-xs transition ${
          isOpen
            ? 'border-apple-accent bg-apple-accent/10 text-apple-accent'
            : 'border-apple-border bg-apple-surface text-apple-text hover:bg-apple-surface-raised'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selected ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/10"
              style={{ backgroundColor: selected.color }}
            />
            <span className="truncate font-medium">{selected.name}</span>
            <span className="shrink-0 text-[10px] text-apple-muted">
              {INSTRUMENT_CATEGORIES[selected.category]}
            </span>
          </div>
        ) : (
          <span className="text-apple-muted">Select an instrument…</span>
        )}
        <ChevronDown
          size={14}
          className={`shrink-0 text-apple-muted transition ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="mt-1.5 max-h-80 overflow-hidden rounded-apple-sm border border-apple-border bg-apple-surface shadow-apple">
          <div className="flex h-9 items-center gap-2 border-b border-apple-border bg-apple-surface-raised px-3">
            <Search size={14} className="text-apple-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search instruments…"
              className="flex-1 bg-transparent text-xs text-apple-text placeholder:text-apple-muted focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-apple-muted transition hover:text-apple-text"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
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
                    : 'bg-apple-bg text-apple-text hover:bg-apple-surface-raised'
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>

          <div className="max-h-56 overflow-y-auto p-3">
            {Object.entries(grouped).map(([category, instruments]) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-apple-muted">
                  <span className="text-apple-accent">{CATEGORY_ICONS[category]}</span>
                  {category}
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {instruments.map((inst) => {
                    const isSelected = selectedInstrumentId === inst.id;
                    return (
                      <button
                        key={inst.id}
                        type="button"
                        onClick={() => handleSelect(inst.id)}
                        onMouseEnter={() => onPreview?.(inst.id)}
                        className={`group flex items-center gap-3 rounded-apple-sm border px-2 py-1.5 text-left transition ${
                          isSelected
                            ? 'border-apple-accent bg-apple-accent/10 text-apple-accent'
                            : 'border-apple-border bg-apple-bg text-apple-text hover:bg-apple-surface-raised'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div
                          className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white/10"
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
              <div className="py-6 text-center text-xs text-apple-muted">No instruments found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
