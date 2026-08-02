'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { GenerationForm } from '@/components/GenerationForm';
import { ProjectCard } from '@/components/ProjectCard';
import { GeneratedProject, GenerationRequest } from '@/lib/types';
import { Loader2, Sparkles } from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = useState<GeneratedProject[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (request: GenerationRequest) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-apple-bg">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="mb-8 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-apple-text sm:text-4xl">
            From words to music
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-apple-muted">
            Describe your track, pick a style, and generate a REAPER project or MIDI file in seconds.
          </p>
        </section>

        <section className="mb-8">
          <GenerationForm onGenerate={handleGenerate} isGenerating={isGenerating} />
        </section>

        {error && (
          <div className="mb-6 rounded-apple-sm border border-apple-danger/30 bg-apple-danger/10 px-4 py-3 text-sm text-apple-danger">
            {error}
          </div>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-apple-text">Generated projects</h2>
            <span className="text-xs font-medium text-apple-muted">{projects.length} project(s)</span>
          </div>

          {projects.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-apple-bg text-apple-accent">
                <Sparkles size={24} />
              </div>
              <h3 className="mt-4 text-base font-semibold text-apple-text">No projects yet</h3>
              <p className="mt-1 max-w-sm text-sm text-apple-muted">
                Choose a preset or describe your track, then click Generate project.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
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
