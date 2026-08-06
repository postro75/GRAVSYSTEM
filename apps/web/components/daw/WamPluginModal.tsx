'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { WamInstrument } from '@/lib/wam-host';

export interface WamPluginModalProps {
  instrument: WamInstrument | null;
  pluginName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function WamPluginModal({ instrument, pluginName, isOpen, onClose }: WamPluginModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const guiRef = useRef<Element | null>(null);
  const [hasGui, setHasGui] = useState(false);

  useEffect(() => {
    if (!isOpen || !instrument || !containerRef.current) return;

    let cancelled = false;
    instrument.createGui(containerRef.current).then((gui) => {
      if (cancelled) {
        if (gui) instrument.destroyGui(gui);
        return;
      }
      if (gui) {
        guiRef.current = gui;
        setHasGui(true);
      } else {
        setHasGui(false);
      }
    });

    return () => {
      cancelled = true;
      if (guiRef.current) {
        instrument.destroyGui(guiRef.current);
        guiRef.current = null;
      }
      setHasGui(false);
    };
  }, [isOpen, instrument]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-apple-lg border border-apple-border bg-apple-surface-raised shadow-apple">
        <div className="flex items-center justify-between border-b border-apple-border px-4 py-3">
          <h3 className="text-sm font-semibold text-apple-text">{pluginName}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-apple-muted transition hover:bg-white/10 hover:text-apple-text"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div
            ref={containerRef}
            className="flex min-h-[240px] items-center justify-center rounded-apple-sm bg-black/20"
          >
            {!hasGui && (
              <div className="text-center text-sm text-apple-muted">
                <p className="font-medium text-apple-text">No native GUI exposed</p>
                <p className="mt-1">This WAM plugin does not provide a web-based interface.</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-apple-border px-4 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-apple-sm bg-apple-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-apple-accent-hover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
