'use client';

import { useEffect, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { PromptBar } from '@/components/daw/PromptBar';
import { Transport } from '@/components/daw/Transport';
import { Timeline } from '@/components/daw/Timeline';
import { PianoRoll } from '@/components/daw/PianoRoll';
import { GenerationForm } from '@/components/GenerationForm';
import { GenerationRequest as FormGenerationRequest } from '@/lib/types';
import { Project, ProjectSchema, Region } from '@gravsystem/core';
import { AudioEngine, AudioEngineState } from '@/lib/audio-engine';
import { downloadMidi } from '@/lib/midi-export';
import { generateProject } from '@/lib/generator';
import {
  loadProjects,
  saveProjects,
  loadLastProjectId,
  saveLastProjectId,
  exportProjectsJson,
  importProjectsJson,
} from '@/lib/storage';
import { Loader2, Download, Upload, FolderOpen } from 'lucide-react';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [dawProject, setDawProject] = useState<Project | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [playerState, setPlayerState] = useState<AudioEngineState>({
    isPlaying: false,
    isReady: false,
    loading: false,
    error: null,
  });
  const [position, setPosition] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const playerRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    const player = new AudioEngine(setPlayerState);
    playerRef.current = player;
    player.init();

    let raf = 0;
    const updatePosition = () => {
      if (playerRef.current) {
        setPosition(playerRef.current.getPositionSeconds());
      }
      raf = requestAnimationFrame(updatePosition);
    };
    raf = requestAnimationFrame(updatePosition);

    return () => {
      cancelAnimationFrame(raf);
      player.dispose();
      playerRef.current = null;
    };
  }, []);

  // Load persisted projects on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadProjects();
      const lastId = await loadLastProjectId();
      if (cancelled) return;
      setProjects(stored);
      if (lastId) {
        const last = stored.find((p) => p.id === lastId);
        if (last) {
          setDawProject(last);
          playerRef.current?.loadProject(last);
        }
      }
      setIsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist projects whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    saveProjects(projects);
    if (dawProject) {
      saveLastProjectId(dawProject.id);
    }
  }, [projects, dawProject, isLoaded]);

  const runGeneration = async (request: FormGenerationRequest) => {
    setIsGenerating(true);
    setError(null);
    try {
      const project = generateProject({
        description: request.description,
        style: request.style,
        bpm: request.bpm,
        key: request.key,
        scale: request.scale,
        bars: request.bars,
      });
      const validated = ProjectSchema.parse(project);
      setProjects((prev) => [validated, ...prev]);
      setDawProject(validated);
      await playerRef.current?.loadProject(validated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromptGenerate = (description: string) => {
    const lowered = description.toLowerCase();
    const style =
      ['jarre', 'ambient', 'synthwave', 'techno', 'house', 'electro', 'dance'].find((s) =>
        lowered.includes(s)
      ) || 'dance';
    runGeneration({ description, style, outputType: 'mid' });
  };

  const handleClassicGenerate = (request: FormGenerationRequest) => runGeneration(request);

  const handlePlay = () => playerRef.current?.play();
  const handlePause = () => playerRef.current?.pause();
  const handleStop = () => playerRef.current?.stop();

  const handleRegionChange = async (updatedRegion: Region) => {
    if (!dawProject) return;
    const nextProject: Project = {
      ...dawProject,
      tracks: dawProject.tracks.map((track) => ({
        ...track,
        regions: track.regions.map((region) =>
          region.id === updatedRegion.id ? updatedRegion : region
        ),
      })),
      updatedAt: new Date().toISOString(),
    };
    setDawProject(nextProject);
    await playerRef.current?.loadProject(nextProject);
  };

  const handleExportMidi = () => {
    if (!dawProject) return;
    try {
      downloadMidi(dawProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const handleExportJson = async () => {
    try {
      const json = await exportProjectsJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gravsystem-projects-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const imported = await importProjectsJson(text);
      setProjects(imported);
      if (imported[0]) {
        setDawProject(imported[0]);
        await playerRef.current?.loadProject(imported[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  return (
    <div className="flex h-screen flex-col bg-apple-bg">
      <Header />

      <main className="flex flex-1 flex-col gap-4 p-4">
        <PromptBar onGenerate={handlePromptGenerate} isGenerating={isGenerating} />
        <Transport
          isPlaying={playerState.isPlaying}
          bpm={dawProject?.bpm ?? 120}
          position={formatTime(position)}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
        />

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleExportJson}
            disabled={projects.length === 0}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-apple-text transition hover:bg-white/10 disabled:opacity-40"
          >
            <FolderOpen size={14} />
            Export JSON
          </button>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-apple-text transition hover:bg-white/10">
            <Upload size={14} />
            Import JSON
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportJson(file);
                e.currentTarget.value = '';
              }}
            />
          </label>
          <button
            onClick={handleExportMidi}
            disabled={!dawProject}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-apple-text transition hover:bg-white/10 disabled:opacity-40"
          >
            <Download size={14} />
            Export MIDI
          </button>
        </div>

        <div className="min-h-0 flex-1">
          <Timeline
            tracks={dawProject?.tracks ?? []}
            bars={dawProject?.bars ?? 16}
            position={position}
            bpm={dawProject?.bpm ?? 120}
            onRegionClick={(_, region) => setSelectedRegion(region)}
          />
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 text-sm font-semibold text-apple-text">Classic generator</h2>
          <GenerationForm onGenerate={handleClassicGenerate} isGenerating={isGenerating} />

          {error && (
            <div className="mt-3 rounded-xl border border-apple-danger/30 bg-apple-danger/10 px-4 py-3 text-sm text-apple-danger">
              {error}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {projects.length === 0 ? (
              <p className="text-sm text-apple-muted">No projects yet. Generate one above.</p>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => {
                    setDawProject(project);
                    playerRef.current?.loadProject(project);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                    dawProject?.id === project.id
                      ? 'border-apple-accent/50 bg-apple-accent/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="font-medium text-apple-text">{project.title}</div>
                  <div className="text-apple-muted">
                    {project.bpm} BPM · {project.key} {project.scale} · {project.tracks.length} tracks
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </main>

      {selectedRegion && dawProject && (
        <PianoRoll
          region={selectedRegion}
          bpm={dawProject.bpm}
          onChange={handleRegionChange}
          onClose={() => setSelectedRegion(null)}
        />
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-apple bg-white px-6 py-4 shadow-apple">
            <Loader2 size={20} className="animate-spin text-apple-accent" />
            <span className="text-sm font-medium text-apple-text">Generating your project...</span>
          </div>
        </div>
      )}
    </div>
  );
}
