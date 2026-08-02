'use client';

import { useState } from 'react';
import { GeneratedProject, ProjectFile } from '@/lib/types';
import { Waveform } from './Waveform';
import {
  Download,
  FileAudio,
  FileMusic,
  Music,
  Play,
  Pause,
  Activity,
  Ruler,
  KeyRound,
  Palette,
  Waves,
} from 'lucide-react';

interface ProjectCardProps {
  project: GeneratedProject;
}

function downloadFile(file: ProjectFile) {
  const blob = base64ToBlob(file.content, file.type);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function base64ToBlob(base64: string, type: 'rpp' | 'mid' | 'wav') {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const mime = {
    rpp: 'text/plain',
    mid: 'audio/midi',
    wav: 'audio/wav',
  }[type];
  return new Blob([bytes], { type: mime });
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<string | null>(null);
  const [loadingWaveform, setLoadingWaveform] = useState(false);

  const rppFile = project.files.find((f) => f.type === 'rpp');
  const midiFile = project.files.find((f) => f.type === 'mid');

  const generateWaveform = async () => {
    if (waveformData) return;
    setLoadingWaveform(true);
    try {
      const res = await fetch('/api/waveform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: project.config }),
      });
      const data = await res.json();
      if (data.success) {
        setWaveformData(data.wav);
      }
    } finally {
      setLoadingWaveform(false);
    }
  };

  const playPreview = async () => {
    if (audio) {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        audio.play();
        setPlaying(true);
      }
      return;
    }

    await generateWaveform();
    if (!waveformData) return;

    const blob = base64ToBlob(waveformData, 'wav');
    const url = URL.createObjectURL(blob);
    const newAudio = new Audio(url);
    newAudio.onended = () => setPlaying(false);
    newAudio.onpause = () => setPlaying(false);
    setAudio(newAudio);
    newAudio.play();
    setPlaying(true);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-apple-text">{project.name}</h3>
          <p className="text-xs text-apple-muted">{formatDate(project.createdAt)}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-apple-accent">
            <span className="inline-flex items-center gap-1 rounded-full bg-apple-bg px-2.5 py-1">
              <Activity size={12} />
              {project.config.bpm} BPM
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-apple-bg px-2.5 py-1">
              <KeyRound size={12} />
              {project.config.key} {project.config.scale}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-apple-bg px-2.5 py-1">
              <Ruler size={12} />
              {project.config.bars} bars
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-apple-bg px-2.5 py-1 capitalize">
              <Palette size={12} />
              {project.config.style}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={playPreview}
          disabled={loadingWaveform}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-apple-accent text-white shadow-apple-sm transition-all hover:scale-105 hover:bg-apple-accent-hover active:scale-95 disabled:opacity-60"
          aria-label={playing ? 'Pause preview' : 'Play preview'}
        >
          {loadingWaveform ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : playing ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" className="ml-0.5" />
          )}
        </button>
      </div>

      {waveformData && <Waveform audioBase64={waveformData} />}

      <div className="flex flex-wrap gap-2">
        {rppFile && (
          <button
            type="button"
            onClick={() => downloadFile(rppFile)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-apple-bg px-3 py-2 text-xs font-medium text-apple-text transition-colors hover:bg-apple-border/40"
          >
            <FileMusic size={14} className="text-apple-accent" />
            Download .rpp
            <Download size={12} className="text-apple-muted" />
          </button>
        )}
        {midiFile && (
          <button
            type="button"
            onClick={() => downloadFile(midiFile)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-apple-bg px-3 py-2 text-xs font-medium text-apple-text transition-colors hover:bg-apple-border/40"
          >
            <FileAudio size={14} className="text-apple-accent" />
            Download .mid
            <Download size={12} className="text-apple-muted" />
          </button>
        )}
        {!waveformData && (
          <button
            type="button"
            onClick={generateWaveform}
            disabled={loadingWaveform}
            className="inline-flex items-center gap-1.5 rounded-lg bg-apple-bg px-3 py-2 text-xs font-medium text-apple-text transition-colors hover:bg-apple-border/40 disabled:opacity-60"
          >
            <Waves size={14} className="text-apple-accent" />
            {loadingWaveform ? 'Generating preview...' : 'Generate preview WAV'}
          </button>
        )}
      </div>
    </div>
  );
}
