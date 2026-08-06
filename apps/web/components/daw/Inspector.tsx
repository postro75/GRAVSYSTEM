'use client';

import { Track, Region } from '@gravsystem/core';
import { trackStyle } from '@/lib/track-styles';
import { getInstrumentById } from '@/lib/instruments';
import { Hash, Clock, Music, Activity, Type, Guitar } from 'lucide-react';
import { InstrumentPicker } from './InstrumentPicker';
import { InstrumentMacroEditor } from './InstrumentMacroEditor';
import { InsertEffectsRack } from './InsertEffectsRack';

export interface InspectorProps {
  project?: {
    title: string;
    bpm: number;
    key: string;
    scale: string;
    bars: number;
    style: string;
  } | null;
  selectedTrack?: Track | null;
  selectedRegion?: Region | null;
  onInstrumentSelect?: (trackId: string, instrumentId: string) => void;
  onInstrumentPreview?: (trackId: string, instrumentId: string) => void;
  onInstrumentParamsChange?: (trackId: string, params: import('@gravsystem/core').InstrumentParams) => void;
  onInsertEffectsChange?: (trackId: string, effects: import('@gravsystem/core').InsertEffects) => void;
  onSidechainChange?: (trackId: string, sidechain: boolean) => void;
  onOpenWamGui?: (trackId: string) => void;
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <div className="flex items-center gap-1.5 text-apple-muted">
        {Icon && <Icon size={12} />}
        <span>{label}</span>
      </div>
      <span className="font-medium text-apple-text">{value}</span>
    </div>
  );
}

export function Inspector({
  project,
  selectedTrack,
  selectedRegion,
  onInstrumentSelect,
  onInstrumentPreview,
  onInstrumentParamsChange,
  onInsertEffectsChange,
  onSidechainChange,
  onOpenWamGui,
}: InspectorProps) {
  const style = selectedTrack ? trackStyle(selectedTrack.name) : null;
  const Icon = style?.icon;
  const category = selectedTrack?.instrument
    ? getInstrumentById(selectedTrack.instrument)?.category
    : undefined;

  return (
    <div className="flex h-full w-64 shrink-0 flex-col overflow-hidden border-l border-apple-border bg-apple-surface">
      <div className="flex h-8 shrink-0 items-center border-b border-apple-border bg-apple-surface-raised px-3 text-[10px] font-semibold uppercase tracking-wider text-apple-muted">
        Inspector
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {project && (
          <div className="mb-4 rounded-apple-sm border border-apple-border bg-apple-bg p-3">
            <div className="mb-2 text-xs font-semibold text-apple-text">Project</div>
            <InfoRow label="Title" value={project.title} icon={Type} />
            <InfoRow label="Style" value={project.style} />
            <InfoRow label="Tempo" value={`${project.bpm} BPM`} icon={Activity} />
            <InfoRow label="Key" value={`${project.key} ${project.scale}`} icon={Music} />
            <InfoRow label="Bars" value={project.bars} icon={Hash} />
          </div>
        )}

        {selectedTrack && (
          <div className="mb-4 rounded-apple-sm border border-apple-border bg-apple-bg p-3">
            <div className="mb-2 flex items-center gap-2">
              {Icon && (
                <div
                  className="flex h-6 w-6 items-center justify-center rounded"
                  style={{ backgroundColor: `${style?.color}25`, color: style?.color }}
                >
                  <Icon size={12} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-apple-text">{selectedTrack.name}</div>
                <div className="text-[10px] text-apple-muted">{selectedTrack.instrument || 'MIDI'}</div>
              </div>
            </div>
            <InfoRow label="Channel" value={selectedTrack.channel} />
            <InfoRow label="Volume" value={`${Math.round((selectedTrack.volume ?? 1) * 100)}%`} />
            <InfoRow label="Pan" value={selectedTrack.pan ?? 0} />
            <InfoRow label="Regions" value={selectedTrack.regions.length} />
            {onSidechainChange && (
              <label className="mt-2 flex cursor-pointer items-center justify-between rounded-apple-sm border border-apple-border bg-apple-surface px-2 py-1.5 text-xs transition hover:bg-apple-surface-raised">
                <span className="text-apple-muted">Side-chain</span>
                <input
                  type="checkbox"
                  checked={selectedTrack.sidechain ?? false}
                  onChange={(e) => onSidechainChange(selectedTrack.id, e.target.checked)}
                  className="h-4 w-4 accent-apple-accent"
                />
              </label>
            )}
            {selectedTrack.instrumentType === 'wam' && onOpenWamGui && (
              <button
                onClick={() => onOpenWamGui(selectedTrack.id)}
                className="mt-2 w-full rounded-apple-sm border border-apple-border bg-apple-surface px-2 py-1.5 text-xs font-medium text-apple-text transition hover:bg-apple-surface-raised"
              >
                Open Plugin UI
              </button>
            )}
          </div>
        )}

        {selectedTrack && onInstrumentSelect && (
          <div className="mb-4 flex h-64 flex-col rounded-apple-sm border border-apple-border bg-apple-bg">
            <div className="flex h-8 items-center gap-2 border-b border-apple-border px-3 text-xs font-semibold text-apple-text">
              <Guitar size={12} />
              Instrument
            </div>
            <div className="min-h-0 flex-1">
              <InstrumentPicker
                selectedInstrumentId={selectedTrack.instrument}
                onSelect={(id) => onInstrumentSelect(selectedTrack.id, id)}
                onPreview={(id) => onInstrumentPreview?.(selectedTrack.id, id)}
              />
            </div>
          </div>
        )}

        {selectedTrack && onInstrumentParamsChange && (
          <div className="mb-4 flex h-72 flex-col">
            <InstrumentMacroEditor
              params={selectedTrack.instrumentParams}
              category={category}
              onChange={(params) => onInstrumentParamsChange(selectedTrack.id, params)}
            />
          </div>
        )}

        {selectedTrack && onInsertEffectsChange && (
          <div className="mb-4">
            <InsertEffectsRack
              effects={selectedTrack.insertEffects}
              onChange={(effects) => onInsertEffectsChange(selectedTrack.id, effects)}
            />
          </div>
        )}

        {selectedRegion && (
          <div className="rounded-apple-sm border border-apple-border bg-apple-bg p-3">
            <div className="mb-2 text-xs font-semibold text-apple-text">Region</div>
            <InfoRow label="Name" value={selectedRegion.name} icon={Type} />
            <InfoRow label="Start" value={`${selectedRegion.startBeat.toFixed(2)} beats`} icon={Clock} />
            <InfoRow label="Duration" value={`${selectedRegion.duration.toFixed(2)} beats`} icon={Clock} />
            <InfoRow label="Notes" value={selectedRegion.midiEvents.length} icon={Music} />
          </div>
        )}

        {!project && !selectedTrack && !selectedRegion && (
          <div className="text-xs text-apple-muted">
            Select a track or region to edit its properties here.
          </div>
        )}
      </div>
    </div>
  );
}
