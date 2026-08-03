'use client';

import { Play, Pause, Square, Bell } from 'lucide-react';

export interface TransportProps {
  isPlaying?: boolean;
  bpm?: number;
  position?: string;
  metronomeEnabled?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onMetronomeToggle?: () => void;
}

export function Transport({
  isPlaying = false,
  bpm = 120,
  position = '00:00:00',
  metronomeEnabled = false,
  onPlay,
  onPause,
  onStop,
  onMetronomeToggle,
}: TransportProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <button
          onClick={onPlay}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition ${
            isPlaying
              ? 'bg-apple-accent ring-2 ring-white/30'
              : 'bg-apple-accent hover:bg-apple-accent/90'
          }`}
        >
          <Play size={16} fill="currentColor" />
        </button>
        <button
          onClick={onPause}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-apple-text hover:bg-white/5"
        >
          <Pause size={16} />
        </button>
        <button
          onClick={onStop}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-apple-text hover:bg-white/5"
        >
          <Square size={14} fill="currentColor" />
        </button>
        <button
          onClick={onMetronomeToggle}
          title="Toggle metronome"
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
            metronomeEnabled
              ? 'border-apple-accent bg-apple-accent text-white'
              : 'border-white/10 text-apple-text hover:bg-white/5'
          }`}
        >
          <Bell size={14} />
        </button>
      </div>

      <div className="font-mono text-lg tabular-nums text-apple-text">{position}</div>

      <div className="flex items-center gap-4 text-sm text-apple-muted">
        <div className="flex items-center gap-2">
          <span>BPM</span>
          <span className="font-medium text-apple-text">{bpm}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Key</span>
          <span className="font-medium text-apple-text">D min</span>
        </div>
      </div>
    </div>
  );
}
