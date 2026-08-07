'use client';

import { Volume2, Play } from 'lucide-react';

export interface AudioSplashProps {
  onStart: () => void;
}

export function AudioSplash({ onStart }: AudioSplashProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-apple-border bg-apple-surface-raised px-4 py-2">
      <div className="flex items-center gap-2 text-xs text-apple-muted">
        <Volume2 size={14} className="text-apple-accent" />
        <span>Audio engine is suspended — click Play or enable audio to start.</span>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="inline-flex items-center gap-1.5 rounded bg-apple-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-apple-accent-hover"
      >
        <Play size={12} fill="currentColor" />
        Enable Audio
      </button>
    </div>
  );
}
