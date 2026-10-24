'use client';

import { useState } from 'react';
import { Wand2, Mic, Loader2 } from 'lucide-react';

export interface ToolbarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export function Toolbar({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating = false,
}: ToolbarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onGenerate();
  };

  return (
    <div className="flex h-14 shrink-0 items-center gap-4 border-b border-apple-border bg-apple-surface px-4">
      <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-2">
        <div
          className={`flex flex-1 items-center gap-2 rounded-md border border-apple-border bg-apple-bg px-3 py-2 transition ${
            isFocused ? 'border-apple-accent ring-1 ring-apple-accent/30' : ''
          }`}
        >
          <Mic size={16} className="shrink-0 text-apple-muted" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Describe your track: Jean-Michel Jarre ambient space, 108 BPM, D minor..."
            className="min-w-0 flex-1 bg-transparent text-sm text-apple-text placeholder:text-apple-muted focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isGenerating || !prompt.trim()}
          className="flex shrink-0 items-center gap-2 rounded-md bg-apple-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-apple-accent-hover disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          <span className="hidden sm:inline">{isGenerating ? 'Generating...' : 'Generate'}</span>
        </button>
      </form>
    </div>
  );
}
