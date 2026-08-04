'use client';

import { useState } from 'react';
import { Track, Region } from '@gravsystem/core';
import { PianoRoll } from './PianoRoll';
import { Mixer } from './Mixer';
import { Piano, SlidersHorizontal } from 'lucide-react';

export interface BottomPanelProps {
  tracks: Track[];
  selectedRegion?: Region | null;
  bpm?: number;
  onRegionChange?: (region: Region) => void;
  onTrackChange: (trackId: string, updates: Partial<Pick<Track, 'volume' | 'pan' | 'mute' | 'solo'>>) => void;
}

export function BottomPanel({
  tracks,
  selectedRegion,
  bpm = 120,
  onRegionChange,
  onTrackChange,
}: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<'piano' | 'mixer'>('piano');

  return (
    <div className="flex h-72 shrink-0 flex-col border-t border-apple-border bg-apple-surface">
      {/* Tabs */}
      <div className="flex h-9 shrink-0 items-center border-b border-apple-border bg-apple-surface-raised">
        <button
          onClick={() => setActiveTab('piano')}
          className={`flex h-full items-center gap-2 border-b-2 px-4 text-xs font-medium transition ${
            activeTab === 'piano'
              ? 'border-apple-accent text-apple-accent'
              : 'border-transparent text-apple-muted hover:text-apple-text'
          }`}
        >
          <Piano size={14} />
          Piano Roll
        </button>
        <button
          onClick={() => setActiveTab('mixer')}
          className={`flex h-full items-center gap-2 border-b-2 px-4 text-xs font-medium transition ${
            activeTab === 'mixer'
              ? 'border-apple-accent text-apple-accent'
              : 'border-transparent text-apple-muted hover:text-apple-text'
          }`}
        >
          <SlidersHorizontal size={14} />
          Mixer
        </button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1">
        {activeTab === 'piano' && selectedRegion ? (
          <PianoRoll region={selectedRegion} bpm={bpm} onChange={onRegionChange} />
        ) : activeTab === 'piano' ? (
          <div className="flex h-full items-center justify-center text-xs text-apple-muted">
            Select a region on the timeline to edit notes in the Piano Roll.
          </div>
        ) : null}

        {activeTab === 'mixer' && <Mixer tracks={tracks} onChange={onTrackChange} />}
      </div>
    </div>
  );
}
