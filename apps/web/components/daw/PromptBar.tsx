'use client';

import { useState } from 'react';
import { Wand2, Mic } from 'lucide-react';

export interface PromptBarProps {
  onGenerate: (prompt: string) => void;
  isGenerating?: boolean;
}

export function PromptBar({ onGenerate, isGenerating = false }: PromptBarProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onGenerate(prompt.trim());
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md"
    >
      <Mic size={18} className="shrink-0 text-apple-muted" />
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your track: Jean-Michel Jarre ambient space, 108 BPM, D minor..."
        className="flex-1 bg-transparent text-sm text-apple-text placeholder:text-apple-muted focus:outline-none"
      />
      <button
        type="submit"
        disabled={isGenerating || !prompt.trim()}
        className="flex items-center gap-2 rounded-xl bg-apple-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-apple-accent/90 disabled:opacity-50"
      >
        <Wand2 size={16} />
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>
    </form>
  );
}
