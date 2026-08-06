'use client';

import {
  Play,
  Pause,
  Square,
  Circle,
  Repeat,
  MousePointer2,
  Pencil,
  Eraser,
  Grid3X3,
  Bell,
} from 'lucide-react';

export type ToolMode = 'cursor' | 'pencil' | 'eraser';
export type SnapGrid = 'off' | '1/1' | '1/2' | '1/4' | '1/8' | '1/16' | '1/32';

export const SNAP_VALUES: SnapGrid[] = ['off', '1/1', '1/2', '1/4', '1/8', '1/16', '1/32'];

export interface TransportBarProps {
  isPlaying?: boolean;
  isRecording?: boolean;
  isLoopEnabled?: boolean;
  metronomeEnabled?: boolean;
  bpm?: number;
  musicalKey?: string;
  scale?: string;
  position?: string;
  snapGrid?: SnapGrid;
  toolMode?: ToolMode;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onRecordToggle?: () => void;
  onLoopToggle?: () => void;
  onMetronomeToggle?: () => void;
  onSnapChange?: (value: SnapGrid) => void;
  onToolModeChange?: (mode: ToolMode) => void;
}

const TOOL_MODES: { mode: ToolMode; icon: React.ElementType; title: string }[] = [
  { mode: 'cursor', icon: MousePointer2, title: 'Select / move (V)' },
  { mode: 'pencil', icon: Pencil, title: 'Draw notes (P)' },
  { mode: 'eraser', icon: Eraser, title: 'Erase notes (E)' },
];

export function TransportBar({
  isPlaying = false,
  isRecording = false,
  isLoopEnabled = false,
  metronomeEnabled = false,
  bpm = 120,
  musicalKey = 'D',
  scale = 'minor',
  position = '00:00.00',
  snapGrid = '1/16',
  toolMode = 'cursor',
  onPlay,
  onPause,
  onStop,
  onRecordToggle,
  onLoopToggle,
  onMetronomeToggle,
  onSnapChange,
  onToolModeChange,
}: TransportBarProps) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-4 border-b border-apple-border bg-apple-surface px-4">
      {/* Transport controls */}
      <div className="flex shrink-0 items-center gap-1 rounded-md border border-apple-border bg-apple-bg p-1">
        <button
          onClick={onRecordToggle}
          className={`flex h-8 w-8 items-center justify-center rounded transition ${
            isRecording
              ? 'bg-apple-danger text-white'
              : 'text-apple-danger hover:bg-apple-surface-raised'
          }`}
          title="Record"
        >
          <Circle size={14} fill="currentColor" />
        </button>
        <button
          onClick={onPlay}
          className={`flex h-8 w-8 items-center justify-center rounded text-white transition ${
            isPlaying ? 'bg-apple-accent' : 'bg-apple-accent hover:bg-apple-accent-hover'
          }`}
          title="Play"
        >
          <Play size={16} fill="currentColor" />
        </button>
        <button
          onClick={onPause}
          className="flex h-8 w-8 items-center justify-center rounded text-apple-text transition hover:bg-apple-surface-raised"
          title="Pause"
        >
          <Pause size={16} />
        </button>
        <button
          onClick={onStop}
          className="flex h-8 w-8 items-center justify-center rounded text-apple-text transition hover:bg-apple-surface-raised"
          title="Stop"
        >
          <Square size={14} fill="currentColor" />
        </button>
        <button
          onClick={onLoopToggle}
          className={`flex h-8 w-8 items-center justify-center rounded border transition ${
            isLoopEnabled
              ? 'border-apple-accent bg-apple-accent text-white'
              : 'border-transparent text-apple-text hover:bg-apple-surface-raised'
          }`}
          title="Loop"
        >
          <Repeat size={14} />
        </button>
        <button
          onClick={onMetronomeToggle}
          className={`flex h-8 w-8 items-center justify-center rounded border transition ${
            metronomeEnabled
              ? 'border-apple-accent bg-apple-accent text-white'
              : 'border-transparent text-apple-text hover:bg-apple-surface-raised'
          }`}
          title="Metronome"
        >
          <Bell size={14} />
        </button>
      </div>

      {/* Snap / Grid */}
      <div className="flex shrink-0 items-center gap-2 rounded-md border border-apple-border bg-apple-bg px-2 py-1">
        <Grid3X3 size={14} className="text-apple-muted" />
        <select
          value={snapGrid}
          onChange={(e) => onSnapChange?.(e.target.value as SnapGrid)}
          className="bg-transparent text-xs font-medium text-apple-text outline-none"
          title="Snap to grid"
        >
          {SNAP_VALUES.map((value) => (
            <option key={value} value={value} className="bg-apple-surface-raised text-apple-text">
              {value === 'off' ? 'Snap: Off' : `Snap: ${value}`}
            </option>
          ))}
        </select>
      </div>

      {/* Tool modes */}
      <div className="flex shrink-0 items-center gap-1 rounded-md border border-apple-border bg-apple-bg p-1">
        {TOOL_MODES.map(({ mode, icon: Icon, title }) => (
          <button
            key={mode}
            onClick={() => onToolModeChange?.(mode)}
            className={`flex h-8 w-8 items-center justify-center rounded transition ${
              toolMode === mode
                ? 'bg-apple-accent text-white'
                : 'text-apple-text hover:bg-apple-surface-raised'
            }`}
            title={title}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      {/* Time / BPM / Key */}
      <div className="ml-auto flex shrink-0 items-center gap-4 rounded-md border border-apple-border bg-apple-bg px-4 py-1.5 text-xs">
        <div className="font-mono text-base tabular-nums text-apple-text">{position}</div>
        <div className="h-4 w-px bg-apple-border" />
        <div className="flex items-center gap-1.5">
          <span className="text-apple-muted">BPM</span>
          <span className="font-medium text-apple-text">{bpm}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-apple-muted">Key</span>
          <span className="font-medium text-apple-text">
            {musicalKey} {scale}
          </span>
        </div>
      </div>
    </div>
  );
}
