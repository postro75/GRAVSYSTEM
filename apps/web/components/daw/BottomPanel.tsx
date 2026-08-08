'use client';

import { useState } from 'react';
import { Track, Region } from '@gravsystem/core';
import { PianoRoll } from './PianoRoll';
import { DrumStepSequencer } from './DrumStepSequencer';
import { Mixer } from './Mixer';
import { ChordPad } from './ChordPad';
import { StepSequencer } from './StepSequencer';
import { VirtualPiano } from './VirtualPiano';
import { AutomationEditor } from './AutomationEditor';
import { Piano, SlidersHorizontal, Music, Grid3X3, Keyboard, Activity } from 'lucide-react';
import { SnapGrid, ToolMode } from './TransportBar';

export type BottomTab = 'piano' | 'mixer' | 'chords' | 'sequencer' | 'keyboard' | 'automation';

function isDrumTrack(track?: Track): boolean {
  if (!track) return false;
  if (track.instrumentType === 'drums') return true;
  return /drum|kick|snare|hat|clap/i.test(track.name);
}

function findTrackForRegion(tracks: Track[], region?: Region | null): Track | undefined {
  if (!region) return undefined;
  return tracks.find((t) => t.regions.some((r) => r.id === region.id));
}

export interface BottomPanelProps {
  tracks: Track[];
  selectedRegion?: Region | null;
  selectedTrackId?: string | null;
  bars?: number;
  bpm?: number;
  keyRoot?: string;
  scale?: 'major' | 'minor';
  position?: number; // seconds
  activeTab?: BottomTab;
  snapGrid?: SnapGrid;
  toolMode?: ToolMode;
  onActiveTabChange?: (tab: BottomTab) => void;
  onRegionChange?: (region: Region) => void;
  onTrackChange: (trackId: string, updates: Partial<Pick<Track, 'volume' | 'pan' | 'mute' | 'solo'>>) => void;
  onPreviewNote?: (trackId: string, pitch: number, velocity?: number) => void;
  onRecordNote?: (note: { pitch: number; velocity: number; start: number; duration: number }) => void;
  onPreviewChord?: (notes: number[]) => void;
  onAutomationChange?: (trackId: string, points: import('@gravsystem/core').AutomationPoint[]) => void;
  getRecordPosition?: () => number;
}

const TABS: { id: BottomTab; label: string; icon: React.ElementType }[] = [
  { id: 'piano', label: 'Piano Roll', icon: Piano },
  { id: 'chords', label: 'Chords', icon: Music },
  { id: 'sequencer', label: 'Steps', icon: Grid3X3 },
  { id: 'keyboard', label: 'Keys', icon: Keyboard },
  { id: 'automation', label: 'Automation', icon: Activity },
  { id: 'mixer', label: 'Mixer', icon: SlidersHorizontal },
];

export function BottomPanel({
  tracks,
  selectedRegion,
  selectedTrackId,
  bars = 16,
  bpm = 120,
  keyRoot = 'C',
  scale = 'minor',
  position = 0,
  activeTab: controlledTab,
  snapGrid = '1/16',
  toolMode = 'cursor',
  onActiveTabChange,
  onRegionChange,
  onTrackChange,
  onPreviewNote,
  onRecordNote,
  onPreviewChord,
  onAutomationChange,
  getRecordPosition,
}: BottomPanelProps) {
  const [internalTab, setInternalTab] = useState<BottomTab>('piano');
  const activeTab = controlledTab ?? internalTab;
  const setActiveTab = (tab: BottomTab) => {
    setInternalTab(tab);
    onActiveTabChange?.(tab);
  };

  return (
    <div className="flex h-80 shrink-0 flex-col border-t border-apple-border bg-apple-surface">
      {/* Tabs */}
      <div className="flex h-8 shrink-0 items-center gap-1 border-b border-apple-border bg-apple-surface-raised px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex h-6 items-center gap-1.5 rounded px-2.5 text-[11px] font-medium transition ${
                isActive
                  ? 'bg-apple-accent text-white shadow-sm'
                  : 'text-apple-muted hover:bg-white/5 hover:text-apple-text'
              }`}
              title={tab.label}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1">
        {activeTab === 'piano' && selectedRegion && (
          (() => {
            const track = findTrackForRegion(tracks, selectedRegion);
            if (isDrumTrack(track)) {
              return (
                <DrumStepSequencer
                  track={track!}
                  region={selectedRegion}
                  bars={bars}
                  bpm={bpm}
                  key={keyRoot}
                  scale={scale}
                  onRegionChange={onRegionChange}
                  onPreviewNote={(pitch, velocity) => {
                    if (selectedTrackId) onPreviewNote?.(selectedTrackId, pitch, velocity);
                  }}
                />
              );
            }
            return (
              <PianoRoll
                region={selectedRegion}
                bpm={bpm}
                bars={bars}
                keyRoot={keyRoot}
                scale={scale}
                snapGrid={snapGrid}
                toolMode={toolMode}
                onChange={onRegionChange}
              />
            );
          })()
        )}
        {activeTab === 'piano' && !selectedRegion && (
          <div className="flex h-full items-center justify-center text-xs text-apple-muted">
            Select a region on the timeline to edit notes.
          </div>
        )}

        {activeTab === 'chords' && (
          <ChordPad
            keyRoot={keyRoot}
            scale={scale}
            selectedRegion={selectedRegion}
            onChange={onRegionChange}
            onPreview={onPreviewChord}
          />
        )}

        {activeTab === 'sequencer' && (
          <StepSequencer selectedRegion={selectedRegion} onChange={onRegionChange} />
        )}

        {activeTab === 'keyboard' && (
          <VirtualPiano
            selectedRegion={selectedRegion}
            getRecordPosition={getRecordPosition}
            onPreview={(pitch, velocity) => {
              if (selectedTrackId) onPreviewNote?.(selectedTrackId, pitch, velocity);
            }}
            onRecordNote={onRecordNote}
          />
        )}

        {activeTab === 'automation' && (
          <AutomationEditor
            track={tracks.find((t) => t.id === selectedTrackId) ?? null}
            bars={bars}
            position={position}
            bpm={bpm}
            onChange={onAutomationChange}
          />
        )}

        {activeTab === 'mixer' && <Mixer tracks={tracks} onChange={onTrackChange} />}
      </div>
    </div>
  );
}
