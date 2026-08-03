'use client';

import { useEffect, useRef, useState } from 'react';
import { Project } from '@gravsystem/core';
import { AudioEngine, AudioEngineState } from '@/lib/audio-engine';
import { Play, Pause, Loader2 } from 'lucide-react';

interface TonePreviewButtonProps {
  project: Project;
}

export function TonePreviewButton({ project }: TonePreviewButtonProps) {
  const playerRef = useRef<AudioEngine | null>(null);
  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    isReady: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    const player = new AudioEngine(setState);
    playerRef.current = player;
    player.init().then(() => {
      player.loadProject(project);
    });

    return () => {
      player.dispose();
      playerRef.current = null;
    };
  }, [project]);

  const toggle = () => {
    if (!playerRef.current) return;
    if (state.isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!state.isReady || state.loading}
      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-apple-accent text-white shadow-apple-sm transition-all hover:scale-105 hover:bg-apple-accent-hover active:scale-95 disabled:opacity-60"
      aria-label={state.isPlaying ? 'Pause preview' : 'Play preview'}
      title={state.error || 'Browser preview'}
    >
      {!state.isReady || state.loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : state.isPlaying ? (
        <Pause size={18} fill="currentColor" />
      ) : (
        <Play size={18} fill="currentColor" className="ml-0.5" />
      )}
    </button>
  );
}
