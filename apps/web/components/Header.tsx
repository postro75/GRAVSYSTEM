import { Music2 } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-apple-border bg-apple-surface/90 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-apple-accent text-white shadow-apple-sm">
            <Music2 size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-apple-text">GRAVSYSTEM</h1>
            <p className="text-[10px] text-apple-muted">AI-powered music project generator</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs font-medium text-apple-muted sm:flex">
          <span className="h-2 w-2 rounded-full bg-apple-success" />
          Ready
        </div>
      </div>
    </header>
  );
}
