'use client';

import { useState } from 'react';
import { GeneratedProject, ProjectFile } from '@/lib/types';
import { TonePreviewButton } from './TonePreviewButton';
import {
  Download,
  FileAudio,
  FileMusic,
  Sparkles,
  Loader2,
  Activity,
  Ruler,
  KeyRound,
  Palette,
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
  const [proAudio, setProAudio] = useState<string | null>(null);
  const [proLoading, setProLoading] = useState(false);
  const [proError, setProError] = useState<string | null>(null);

  const rppFile = project.files.find((f) => f.type === 'rpp');
  const midiFile = project.files.find((f) => f.type === 'mid');

  const renderStableAudio = async () => {
    setProLoading(true);
    setProError(null);
    try {
      const res = await fetch('/api/render-stable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: project.config }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Pro render failed');
      }
      setProAudio(data.wav);
    } catch (err) {
      setProError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setProLoading(false);
    }
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
        <TonePreviewButton config={project.config} />
      </div>

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
        <button
          type="button"
          onClick={renderStableAudio}
          disabled={proLoading || !!proAudio}
          className="inline-flex items-center gap-1.5 rounded-lg bg-apple-accent px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-apple-accent-hover disabled:opacity-60"
        >
          {proLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {proLoading ? 'Rendering...' : proAudio ? 'Pro render ready' : 'Pro render (Stable Audio)'}
        </button>
      </div>

      {proError && (
        <p className="text-xs text-apple-danger">{proError}</p>
      )}

      {proAudio && (
        <audio controls className="w-full" src={`data:audio/wav;base64,${proAudio}`} />
      )}
    </div>
  );
}
