'use client';

import { useEffect, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { Toolbar } from '@/components/daw/Toolbar';
import { TrackHeaders } from '@/components/daw/TrackHeaders';
import { Timeline } from '@/components/daw/Timeline';
import { Inspector } from '@/components/daw/Inspector';
import { WamPluginModal } from '@/components/daw/WamPluginModal';
import { BottomPanel, BottomTab } from '@/components/daw/BottomPanel';
import { ProjectManager } from '@/components/daw/ProjectManager';
import { GenerationRequest as FormGenerationRequest } from '@/lib/types';
import { getInstrumentById } from '@/lib/instruments';
import { Project, ProjectSchema, Region, Track, InstrumentParams, AutomationPoint, InsertEffects } from '@gravsystem/core';
import { AudioEngine, AudioEngineState } from '@/lib/audio-engine';
import { downloadMidi } from '@/lib/midi-export';
import { downloadRpp } from '@/lib/rpp-export';
import { renderProjectToWav, downloadWav } from '@/lib/audio-export';
import { renderProjectOnBackend, downloadRenderResult } from '@/lib/render-client';
import { generateProject } from '@/lib/generator';
import {
  loadProjects,
  saveProjects,
  loadLastProjectId,
  saveLastProjectId,
  exportProjectsJson,
  importProjectsJson,
} from '@/lib/storage';
import { Loader2, Info, X } from 'lucide-react';

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
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(true);
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isBackendRendering, setIsBackendRendering] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('piano');
  const [meterLevels, setMeterLevels] = useState<Record<string, number>>({});
  const [wamPluginTrackId, setWamPluginTrackId] = useState<string | null>(null);

  const playerRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    const player = new AudioEngine(setPlayerState);
    playerRef.current = player;
    player.init();

    let raf = 0;
    const updatePosition = () => {
      if (playerRef.current) {
        setPosition(playerRef.current.getPositionSeconds());
        setMeterLevels(playerRef.current.getMeterValues());
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
          setSelectedTrackId(last.tracks[0]?.id ?? null);
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
      setSelectedTrackId(validated.tracks[0]?.id ?? null);
      setSelectedRegion(null);
      await playerRef.current?.loadProject(validated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromptGenerate = () => {
    const description = prompt.trim();
    if (!description) return;
    const lowered = description.toLowerCase();
    const style =
      ['jarre', 'ambient', 'synthwave', 'techno', 'house', 'electro', 'dance'].find((s) =>
        lowered.includes(s)
      ) || 'dance';
    runGeneration({ description, style, outputType: 'mid' });
  };

  const handlePlay = async () => {
    if (!playerState.isReady) {
      await playerRef.current?.resumeAudio();
    }
    playerRef.current?.play();
  };
  const handlePause = () => playerRef.current?.pause();
  const handleStop = () => playerRef.current?.stop();
  const handleEnableAudio = () => playerRef.current?.resumeAudio();

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
    setProjects((prev) => prev.map((p) => (p.id === nextProject.id ? nextProject : p)));
    if (selectedRegion?.id === updatedRegion.id) {
      setSelectedRegion(updatedRegion);
    }
    await playerRef.current?.loadProject(nextProject);
  };

  const handleRegionDuplicate = async (region: Region) => {
    if (!dawProject) return;
    const newRegion: Region = {
      ...region,
      id: crypto.randomUUID(),
      startBeat: region.startBeat + region.duration,
    };
    const nextProject: Project = {
      ...dawProject,
      tracks: dawProject.tracks.map((track) =>
        track.regions.some((r) => r.id === region.id)
          ? { ...track, regions: [...track.regions, newRegion] }
          : track
      ),
      updatedAt: new Date().toISOString(),
    };
    setDawProject(nextProject);
    setProjects((prev) => prev.map((p) => (p.id === nextProject.id ? nextProject : p)));
    await playerRef.current?.loadProject(nextProject);
  };

  const handleRegionDelete = async (region: Region) => {
    if (!dawProject) return;
    const nextProject: Project = {
      ...dawProject,
      tracks: dawProject.tracks.map((track) => ({
        ...track,
        regions: track.regions.filter((r) => r.id !== region.id),
      })),
      updatedAt: new Date().toISOString(),
    };
    setDawProject(nextProject);
    setProjects((prev) => prev.map((p) => (p.id === nextProject.id ? nextProject : p)));
    if (selectedRegion?.id === region.id) {
      setSelectedRegion(null);
    }
    await playerRef.current?.loadProject(nextProject);
  };

  const handleTrackChange = (
    trackId: string,
    updates: Partial<Pick<Track, 'volume' | 'pan' | 'mute' | 'solo'>>
  ) => {
    if (!dawProject) return;
    playerRef.current?.updateTrack(trackId, updates);
    const nextProject: Project = {
      ...dawProject,
      tracks: dawProject.tracks.map((track) =>
        track.id === trackId ? { ...track, ...updates } : track
      ),
      updatedAt: new Date().toISOString(),
    };
    setDawProject(nextProject);
    setProjects((prev) => prev.map((p) => (p.id === nextProject.id ? nextProject : p)));
  };

  const handleInstrumentParamsChange = (trackId: string, params: InstrumentParams) => {
    if (!dawProject) return;
    playerRef.current?.updateInstrumentParams(trackId, params);
    const nextProject: Project = {
      ...dawProject,
      tracks: dawProject.tracks.map((track) =>
        track.id === trackId ? { ...track, instrumentParams: params } : track
      ),
      updatedAt: new Date().toISOString(),
    };
    setDawProject(nextProject);
    setProjects((prev) => prev.map((p) => (p.id === nextProject.id ? nextProject : p)));
  };

  const handleExportMidi = () => {
    if (!dawProject) return;
    try {
      downloadMidi(dawProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const handleExportWav = async () => {
    if (!dawProject) return;
    setIsRendering(true);
    setError(null);
    try {
      const blob = await renderProjectToWav(dawProject);
      downloadWav(blob, `${dawProject.title}.wav`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'WAV export failed');
    } finally {
      setIsRendering(false);
    }
  };

  const handleBackendRender = async () => {
    if (!dawProject) return;
    setIsBackendRendering(true);
    setError(null);
    try {
      const result = await renderProjectOnBackend(dawProject);
      downloadRenderResult(result);
      if (result.type === 'midi') {
        setError(`Backend render fallback: ${result.diagnostic}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backend render failed');
    } finally {
      setIsBackendRendering(false);
    }
  };

  const handleToggleMetronome = () => {
    const next = !metronomeEnabled;
    setMetronomeEnabled(next);
    playerRef.current?.setMetronome(next);
  };

  const handleExportRpp = () => {
    if (!dawProject) return;
    try {
      downloadRpp(dawProject);
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
        setSelectedTrackId(imported[0].tracks[0]?.id ?? null);
        setSelectedRegion(null);
        await playerRef.current?.loadProject(imported[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const handleLoadProject = (project: Project) => {
    setDawProject(project);
    setSelectedTrackId(project.tracks[0]?.id ?? null);
    setSelectedRegion(null);
    playerRef.current?.loadProject(project);
    setIsProjectManagerOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (dawProject?.id === projectId) {
      setDawProject(null);
      setSelectedTrackId(null);
      setSelectedRegion(null);
    }
  };

  const handleRenameProject = (projectId: string, title: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, title, updatedAt: new Date().toISOString() } : p))
    );
    if (dawProject?.id === projectId) {
      setDawProject((prev) => (prev ? { ...prev, title, updatedAt: new Date().toISOString() } : prev));
    }
  };

  const handleRegionClick = (track: Track, region: Region) => {
    setSelectedRegion(region);
    setSelectedTrackId(track.id);
    const isDrum = /drum|kick|snare|hat|clap/i.test(track.name) || track.instrumentType === 'drums';
    setActiveBottomTab(isDrum ? 'sequencer' : 'piano');
  };

  const handleInstrumentSelect = async (trackId: string, instrumentId: string) => {
    if (!dawProject) return;
    const nextProject: Project = {
      ...dawProject,
      tracks: dawProject.tracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              instrument: instrumentId,
              instrumentType: getInstrumentById(instrumentId)?.type ?? 'custom',
              updatedAt: new Date().toISOString(),
            }
          : track
      ),
      updatedAt: new Date().toISOString(),
    };
    setDawProject(nextProject);
    setProjects((prev) => prev.map((p) => (p.id === nextProject.id ? nextProject : p)));
    await playerRef.current?.setInstrument(trackId, instrumentId);
  };

  const handleInstrumentPreview = (trackId: string, _instrumentId: string) => {
    // Preview C3 on the selected track using the new instrument.
    playerRef.current?.previewNote(trackId, 60, 100, 0.4);
  };

  const handleAutomationChange = (trackId: string, points: AutomationPoint[]) => {
    if (!dawProject) return;
    playerRef.current?.updateAutomation(trackId, points);
    const nextProject: Project = {
      ...dawProject,
      tracks: dawProject.tracks.map((track) =>
        track.id === trackId ? { ...track, automation: points } : track
      ),
      updatedAt: new Date().toISOString(),
    };
    setDawProject(nextProject);
    setProjects((prev) => prev.map((p) => (p.id === nextProject.id ? nextProject : p)));
  };

  const handlePreviewChord = (notes: number[]) => {
    if (!selectedTrackId) return;
    notes.forEach((note, i) => {
      setTimeout(() => playerRef.current?.previewNote(selectedTrackId, note, 100, 0.5), i * 20);
    });
  };

  const handleRecordNote = (note: { pitch: number; velocity: number; start: number; duration: number; replace?: boolean }) => {
    if (!selectedRegion) return;
    const baseEvents = note.replace ? [] : selectedRegion.midiEvents;
    const updatedRegion: Region = {
      ...selectedRegion,
      midiEvents: [...baseEvents, note],
      duration: Math.max(selectedRegion.duration, note.start + note.duration),
    };
    handleRegionChange(updatedRegion);
  };

  const handleInsertEffectsChange = (trackId: string, effects: InsertEffects) => {
    if (!dawProject) return;
    playerRef.current?.updateInsertEffects(trackId, effects);
    const nextProject: Project = {
      ...dawProject,
      tracks: dawProject.tracks.map((track) =>
        track.id === trackId ? { ...track, insertEffects: effects } : track
      ),
      updatedAt: new Date().toISOString(),
    };
    setDawProject(nextProject);
    setProjects((prev) => prev.map((p) => (p.id === nextProject.id ? nextProject : p)));
  };

  const handleSidechainChange = (trackId: string, sidechain: boolean) => {
    if (!dawProject) return;
    playerRef.current?.updateSidechain(trackId, sidechain);
    const nextProject: Project = {
      ...dawProject,
      tracks: dawProject.tracks.map((track) =>
        track.id === trackId ? { ...track, sidechain } : track
      ),
      updatedAt: new Date().toISOString(),
    };
    setDawProject(nextProject);
    setProjects((prev) => prev.map((p) => (p.id === nextProject.id ? nextProject : p)));
  };

  const handleOpenWamGui = (trackId: string) => {
    setWamPluginTrackId(trackId);
  };

  const selectedTrack = dawProject?.tracks.find((t) => t.id === selectedTrackId) ?? null;
  const wamPluginInstrument = wamPluginTrackId
    ? (playerRef.current?.getInstrument(wamPluginTrackId) as import('@/lib/wam-host').WamInstrument | undefined)
    : null;
  const wamPluginName = wamPluginTrackId
    ? (getInstrumentById(
        dawProject?.tracks.find((t) => t.id === wamPluginTrackId)?.instrument ?? ''
      )?.name ?? 'WAM Plugin')
    : 'WAM Plugin';

  return (
    <div className="flex h-screen flex-col bg-apple-bg">
      <Header />

      <Toolbar
        prompt={prompt}
        onPromptChange={setPrompt}
        onGenerate={handlePromptGenerate}
        isGenerating={isGenerating}
        isPlaying={playerState.isPlaying}
        bpm={dawProject?.bpm ?? 120}
        key={dawProject?.key ?? 'D'}
        scale={dawProject?.scale ?? 'minor'}
        position={formatTime(position)}
        metronomeEnabled={metronomeEnabled}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onMetronomeToggle={handleToggleMetronome}
        onExportMidi={handleExportMidi}
        onExportWav={handleExportWav}
        onExportRpp={handleExportRpp}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onOpenProjects={() => setIsProjectManagerOpen(true)}
        onRenderBackend={handleBackendRender}
        canExport={!!dawProject}
        isRendering={isRendering}
        isBackendRendering={isBackendRendering}
      />

      {!playerState.isReady && !playerState.loading && (
        <button
          onClick={handleEnableAudio}
          className="flex w-full items-center justify-center gap-2 border-b border-apple-border bg-apple-accent/10 px-4 py-2 text-sm font-medium text-apple-accent transition hover:bg-apple-accent/20"
        >
          Enable Audio
        </button>
      )}

      {showHints && (
        <div className="flex items-start gap-3 border-b border-apple-border bg-apple-surface-raised px-4 py-2 text-sm text-apple-text">
          <Info size={16} className="mt-0.5 shrink-0 text-apple-accent" />
          <div className="flex-1 space-y-1">
            <p className="font-medium">Getting started — 3 steps</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-apple-muted">
              <span>
                <strong className="text-apple-text">1.</strong> Type a style and click Generate.
              </span>
              <span>
                <strong className="text-apple-text">2.</strong> Click Enable Audio, then Play.
              </span>
              <span>
                <strong className="text-apple-text">3.</strong> Click a region to edit, or use the Inspector on the right to change instruments.
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowHints(false)}
            className="shrink-0 rounded p-1 text-apple-muted hover:bg-white/10"
            title="Hide hints"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex w-full items-center justify-between border-b border-apple-danger/30 bg-apple-danger/10 px-4 py-2 text-sm text-apple-danger">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="rounded p-1 hover:bg-white/10">
            <X size={14} />
          </button>
        </div>
      )}

      <main className="flex min-h-0 flex-1">
        <TrackHeaders
          tracks={dawProject?.tracks ?? []}
          selectedTrackId={selectedTrackId}
          meterLevels={meterLevels}
          onTrackChange={handleTrackChange}
          onSelectTrack={setSelectedTrackId}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <Timeline
              tracks={dawProject?.tracks ?? []}
              bars={dawProject?.bars ?? 16}
              position={position}
              bpm={dawProject?.bpm ?? 120}
              selectedRegionId={selectedRegion?.id}
              onRegionClick={handleRegionClick}
              onRegionChange={handleRegionChange}
              onRegionDuplicate={handleRegionDuplicate}
              onRegionDelete={handleRegionDelete}
            />
          </div>

          <BottomPanel
            tracks={dawProject?.tracks ?? []}
            selectedRegion={selectedRegion}
            selectedTrackId={selectedTrackId}
            bars={dawProject?.bars ?? 16}
            bpm={dawProject?.bpm ?? 120}
            keyRoot={dawProject?.key ?? 'C'}
            scale={dawProject?.scale ?? 'minor'}
            position={position}
            activeTab={activeBottomTab}
            onActiveTabChange={setActiveBottomTab}
            onRegionChange={handleRegionChange}
            onTrackChange={handleTrackChange}
            onPreviewNote={(trackId, pitch, velocity) =>
              playerRef.current?.previewNote(trackId, pitch, velocity ?? 100, 0.4)
            }
            onRecordNote={handleRecordNote}
            onPreviewChord={handlePreviewChord}
            onAutomationChange={handleAutomationChange}
            getRecordPosition={() => playerRef.current?.getPositionBeats() ?? 0}
          />
        </div>

        <Inspector
          project={
            dawProject
              ? {
                  title: dawProject.title,
                  bpm: dawProject.bpm,
                  key: dawProject.key,
                  scale: dawProject.scale,
                  bars: dawProject.bars,
                  style: dawProject.style,
                }
              : null
          }
          selectedTrack={selectedTrack}
          selectedRegion={selectedRegion}
          onInstrumentSelect={handleInstrumentSelect}
          onInstrumentPreview={handleInstrumentPreview}
          onInstrumentParamsChange={handleInstrumentParamsChange}
          onInsertEffectsChange={handleInsertEffectsChange}
          onSidechainChange={handleSidechainChange}
          onOpenWamGui={handleOpenWamGui}
        />

        <WamPluginModal
          instrument={wamPluginInstrument ?? null}
          pluginName={wamPluginName}
          isOpen={!!wamPluginTrackId}
          onClose={() => setWamPluginTrackId(null)}
        />
      </main>

      <ProjectManager
        projects={projects}
        currentProjectId={dawProject?.id}
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        onLoad={handleLoadProject}
        onDelete={handleDeleteProject}
        onRename={handleRenameProject}
      />

      {isGenerating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-apple bg-apple-surface px-6 py-4 shadow-apple ring-1 ring-apple-border">
            <Loader2 size={20} className="animate-spin text-apple-accent" />
            <span className="text-sm font-medium text-apple-text">Generating your project...</span>
          </div>
        </div>
      )}
    </div>
  );
}
