'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { ProjectCard } from '@/components/ProjectCard';
import { PromptBar } from '@/components/daw/PromptBar';
import { Transport } from '@/components/daw/Transport';
import { Timeline } from '@/components/daw/Timeline';
import { GenerationForm } from '@/components/GenerationForm';
import { GeneratedProject, GenerationRequest } from '@/lib/types';
import { Project, createProject, createTrack } from '@gravsystem/core';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = useState<GeneratedProject[]>([]);
  const [dawProject, setDawProject] = useState<Project | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runGeneration = async (request: GenerationRequest) => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }
      setProjects((prev) => [data.project, ...prev]);

      // Build a DAW project view from the generated config
      const config = data.project.config;
      const project = createProject({
        title: data.project.name,
        description: request.description,
        bpm: config.bpm,
        key: config.key,
        scale: config.scale,
        bars: config.bars,
      });
      const tracks = config.trackLayout.map((name: string) =>
        createTrack({ name, type: 'midi' })
      );
      project.tracks = tracks;
      setDawProject(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromptGenerate = (description: string) =>
    runGeneration({
      description,
      style: 'dance',
      outputType: 'mid',
      addFx: true,
    });

  const handleClassicGenerate = (request: GenerationRequest) => runGeneration(request);

  return (
    <div className="flex h-screen flex-col bg-apple-bg">
      <Header />

      <main className="flex flex-1 flex-col gap-4 p-4">
        <PromptBar onGenerate={handlePromptGenerate} isGenerating={isGenerating} />
        <Transport bpm={dawProject?.bpm ?? 120} />

        <div className="min-h-0 flex-1">
          <Timeline tracks={dawProject?.tracks ?? []} bars={dawProject?.bars ?? 16} />
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
              projects.map((project) => <ProjectCard key={project.id} project={project} />)
            )}
          </div>
        </section>
      </main>

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
