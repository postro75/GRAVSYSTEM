'use client';

import { Music2, Volume2 } from 'lucide-react';

export interface AudioSplashProps {
  onStart: () => void;
}

export function AudioSplash({ onStart }: AudioSplashProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-apple-bg/95 backdrop-blur-sm"
      onClick={onStart}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onStart();
      }}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-apple-accent shadow-[0_0_40px_rgba(45,140,255,0.35)]">
        <Music2 size={40} className="text-white" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-apple-text">GRAVSYSTEM</h1>
        <p className="mt-1 text-sm text-apple-muted">Click anywhere to start the audio engine</p>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-apple-border bg-apple-surface px-4 py-2 text-xs text-apple-muted">
        <Volume2 size={14} />
        <span>Your browser requires a click to enable audio</span>
      </div>
    </div>
  );
}
