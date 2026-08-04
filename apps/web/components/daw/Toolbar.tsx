'use client';

import { useState } from 'react';
import {
  Wand2,
  Play,
  Pause,
  Square,
  Bell,
  Download,
  FolderOpen,
  Upload,
  Loader2,
  Music2,
  Mic,
} from 'lucide-react';

export interface ToolbarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  isPlaying?: boolean;
  bpm?: number;
  key?: string;
  scale?: string;
  position?: string;
  metronomeEnabled?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onMetronomeToggle?: () => void;
  onExportMidi?: () => void;
  onExportWav?: () => void;
  onExportRpp?: () => void;
  onExportJson?: () => void;
  onImportJson?: (file: File) => void;
  onOpenProjects?: () => void;
  canExport?: boolean;
  isRendering?: boolean;
}

export function Toolbar({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating = false,
  isPlaying = false,
  bpm = 120,
  key = 'D',
  scale = 'minor',
  position = '00:00.00',
  metronomeEnabled = false,
  onPlay,
  onPause,
  onStop,
  onMetronomeToggle,
  onExportMidi,
  onExportWav,
  onExportRpp,
  onExportJson,
  onImportJson,
  onOpenProjects,
  canExport = false,
  isRendering = false,
}: ToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onGenerate();
  };

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-apple-border bg-apple-surface px-4 py-3">
      {/* Top row: prompt + transport + actions */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-apple-sm border border-apple-border bg-apple-bg px-3 py-2 ring-1 ring-transparent transition focus-within:border-apple-accent focus-within:ring-apple-accent/30">
            <Mic size={16} className="shrink-0 text-apple-muted" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="Describe your track: Jean-Michel Jarre ambient space, 108 BPM, D minor..."
              className="min-w-0 flex-1 bg-transparent text-sm text-apple-text placeholder:text-apple-muted focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="flex shrink-0 items-center gap-2 rounded-apple-sm bg-apple-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-apple-accent-hover disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            <span className="hidden sm:inline">{isGenerating ? 'Generating...' : 'Generate'}</span>
          </button>
        </form>

        {/* Transport */}
        <div className="flex shrink-0 items-center gap-1 rounded-apple-sm border border-apple-border bg-apple-bg px-2 py-1.5">
          <button
            onClick={onPlay}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-white transition ${
              isPlaying ? 'bg-apple-accent ring-2 ring-white/20' : 'bg-apple-accent hover:bg-apple-accent-hover'
            }`}
            title="Play"
          >
            <Play size={14} fill="currentColor" />
          </button>
          <button
            onClick={onPause}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-apple-text transition hover:bg-white/10"
            title="Pause"
          >
            <Pause size={14} />
          </button>
          <button
            onClick={onStop}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-apple-text transition hover:bg-white/10"
            title="Stop"
          >
            <Square size={12} fill="currentColor" />
          </button>
          <button
            onClick={onMetronomeToggle}
            title="Toggle metronome"
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
              metronomeEnabled
                ? 'border-apple-accent bg-apple-accent text-white'
                : 'border-transparent text-apple-text hover:bg-white/10'
            }`}
          >
            <Bell size={13} />
          </button>
        </div>

        {/* Time / BPM */}
        <div className="flex shrink-0 items-center gap-3 rounded-apple-sm border border-apple-border bg-apple-bg px-3 py-1.5 text-xs">
          <div className="font-mono text-base tabular-nums text-apple-text">{position}</div>
          <div className="h-4 w-px bg-apple-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-apple-muted">BPM</span>
            <span className="font-medium text-apple-text">{bpm}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-apple-muted">Key</span>
            <span className="font-medium text-apple-text">
              {key} {scale}
            </span>
          </div>
        </div>

        {/* Projects */}
        <button
          onClick={onOpenProjects}
          className="flex shrink-0 items-center gap-2 rounded-apple-sm border border-apple-border bg-apple-bg px-3 py-2 text-sm font-medium text-apple-text transition hover:bg-apple-surface-raised"
          title="Projects"
        >
          <FolderOpen size={16} />
          <span className="hidden sm:inline">Projects</span>
        </button>

        {/* Export menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowExportMenu((v) => !v)}
            disabled={!canExport}
            className="flex items-center gap-2 rounded-apple-sm border border-apple-border bg-apple-bg px-3 py-2 text-sm font-medium text-apple-text transition hover:bg-apple-surface-raised disabled:opacity-40"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          {showExportMenu && canExport && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-apple-sm border border-apple-border bg-apple-surface-raised py-1 shadow-apple">
                <button
                  onClick={() => {
                    onExportMidi?.();
                    setShowExportMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-apple-text transition hover:bg-white/5"
                >
                  <Music2 size={14} />
                  Export MIDI
                </button>
                <button
                  onClick={() => {
                    onExportRpp?.();
                    setShowExportMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-apple-text transition hover:bg-white/5"
                >
                  <Download size={14} />
                  Export REAPER
                </button>
                <button
                  onClick={() => {
                    onExportWav?.();
                    setShowExportMenu(false);
                  }}
                  disabled={isRendering}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-apple-text transition hover:bg-white/5 disabled:opacity-40"
                >
                  {isRendering ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Export WAV
                </button>
                <div className="my-1 h-px bg-apple-border" />
                <button
                  onClick={() => {
                    onExportJson?.();
                    setShowExportMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-apple-text transition hover:bg-white/5"
                >
                  <Upload size={14} />
                  Export JSON
                </button>
                <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-apple-text transition hover:bg-white/5">
                  <Upload size={14} />
                  Import JSON
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onImportJson?.(file);
                      e.currentTarget.value = '';
                      setShowExportMenu(false);
                    }}
                  />
                </label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
