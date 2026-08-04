'use client';

import { useState } from 'react';
import { Project } from '@gravsystem/core';
import { X, Trash2, FolderOpen, Music2, Loader2 } from 'lucide-react';

export interface ProjectManagerProps {
  projects: Project[];
  currentProjectId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onLoad: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onRename?: (projectId: string, title: string) => void;
}

export function ProjectManager({
  projects,
  currentProjectId,
  isOpen,
  onClose,
  onLoad,
  onDelete,
  onRename,
}: ProjectManagerProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  const startRename = (project: Project) => {
    setEditingId(project.id);
    setEditTitle(project.title);
  };

  const commitRename = () => {
    if (editingId && editTitle.trim()) {
      onRename?.(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-apple border border-apple-border bg-apple-surface shadow-apple">
        <div className="flex items-center justify-between border-b border-apple-border px-4 py-3">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-apple-accent" />
            <h2 className="text-base font-semibold text-apple-text">Projects</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-apple-muted transition hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Music2 size={40} className="text-apple-muted/50" />
              <div className="text-sm text-apple-muted">No projects yet.</div>
              <div className="text-xs text-apple-muted">
                Generate a track using the prompt bar to get started.
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              {projects.map((project) => {
                const isCurrent = project.id === currentProjectId;
                return (
                  <div
                    key={project.id}
                    className={`flex items-center gap-3 rounded-apple-sm border px-3 py-2 transition ${
                      isCurrent
                        ? 'border-apple-accent/50 bg-apple-accent/10'
                        : 'border-apple-border bg-apple-bg hover:bg-apple-surface-raised'
                    }`}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-apple-surface-raised text-apple-accent">
                      <Music2 size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      {editingId === project.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitRename();
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setEditTitle('');
                            }
                          }}
                          autoFocus
                          className="w-full rounded bg-apple-bg px-2 py-1 text-sm text-apple-text outline-none ring-1 ring-apple-accent"
                        />
                      ) : (
                        <button
                          onClick={() => startRename(project)}
                          className="block truncate text-left text-sm font-medium text-apple-text hover:text-apple-accent"
                          title="Click to rename"
                        >
                          {project.title}
                        </button>
                      )}
                      <div className="text-[10px] text-apple-muted">
                        {project.bpm} BPM · {project.key} {project.scale} · {project.tracks.length} tracks ·{' '}
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {!isCurrent && (
                        <button
                          onClick={() => onLoad(project)}
                          className="flex items-center gap-1 rounded-lg bg-apple-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-apple-accent-hover"
                        >
                          <FolderOpen size={12} />
                          Load
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setDeletingId(project.id);
                          onDelete(project.id);
                        }}
                        disabled={deletingId === project.id}
                        className="rounded-lg p-1.5 text-apple-danger transition hover:bg-apple-danger/10 disabled:opacity-40"
                        title="Delete project"
                      >
                        {deletingId === project.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
