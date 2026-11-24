'use client';

import { Music2 } from 'lucide-react';
import { AppMenu, AppMenuProps } from './daw/AppMenu';

export function Header(props: AppMenuProps) {
  return (
    <header className="sticky top-0 z-50 h-12 border-b border-apple-border bg-apple-surface px-4">
      <div className="flex h-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-apple-accent text-white">
            <Music2 size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-apple-text">GRAVSYSTEM</h1>
            <p className="text-[10px] leading-tight text-apple-muted">AI music project generator</p>
          </div>
        </div>
        <AppMenu {...props} />
      </div>
    </header>
  );
}
