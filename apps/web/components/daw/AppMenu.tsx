'use client';

import { useState, useRef } from 'react';
import { Download, FolderOpen, Upload, Music2, Loader2, Server } from 'lucide-react';

export interface AppMenuProps {
  canExport?: boolean;
  isRendering?: boolean;
  isBackendRendering?: boolean;
  onExportMidi?: () => void;
  onExportWav?: () => void;
  onExportRpp?: () => void;
  onExportJson?: () => void;
  onExportDesktopJson?: () => void;
  onImportJson?: (file: File) => void;
  onOpenProjects?: () => void;
  onRenderBackend?: () => void;
}

export function AppMenu({
  canExport = false,
  isRendering = false,
  isBackendRendering = false,
  onExportMidi,
  onExportWav,
  onExportRpp,
  onExportJson,
  onExportDesktopJson,
  onImportJson,
  onOpenProjects,
  onRenderBackend,
}: AppMenuProps) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={onOpenProjects}
        className="flex items-center gap-2 rounded-md border border-apple-border bg-apple-bg px-3 py-2 text-sm font-medium text-apple-text transition hover:bg-apple-surface-raised"
        title="Projects"
      >
        <FolderOpen size={16} />
        <span className="hidden sm:inline">Projects</span>
      </button>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={!canExport}
          className="flex items-center gap-2 rounded-md border border-apple-border bg-apple-bg px-3 py-2 text-sm font-medium text-apple-text transition hover:bg-apple-surface-raised disabled:opacity-40"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>

        {open && canExport && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-md border border-apple-border bg-apple-surface-raised py-1 shadow-apple">
              <MenuItem
                icon={<Music2 size={14} />}
                label="Export MIDI"
                onClick={() => {
                  onExportMidi?.();
                  setOpen(false);
                }}
              />
              <MenuItem
                icon={<Download size={14} />}
                label="Export REAPER"
                onClick={() => {
                  onExportRpp?.();
                  setOpen(false);
                }}
              />
              <MenuItem
                icon={isRendering ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                label="Export WAV"
                disabled={isRendering}
                onClick={() => {
                  onExportWav?.();
                  setOpen(false);
                }}
              />
              <MenuItem
                icon={isBackendRendering ? <Loader2 size={14} className="animate-spin" /> : <Server size={14} />}
                label="Render WAV (backend)"
                disabled={isBackendRendering}
                onClick={() => {
                  onRenderBackend?.();
                  setOpen(false);
                }}
              />
              <div className="my-1 h-px bg-apple-border" />
              <MenuItem
                icon={<Upload size={14} />}
                label="Export JSON"
                onClick={() => {
                  onExportJson?.();
                  setOpen(false);
                }}
              />
              <MenuItem
                icon={<Download size={14} />}
                label="Export for Desktop"
                onClick={() => {
                  onExportDesktopJson?.();
                  setOpen(false);
                }}
              />
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-apple-text transition hover:bg-white/5">
                <Upload size={14} />
                Import JSON
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onImportJson?.(file);
                    e.currentTarget.value = '';
                    setOpen(false);
                  }}
                />
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-apple-text transition hover:bg-white/5 disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  );
}
