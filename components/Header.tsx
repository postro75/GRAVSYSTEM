import { Music2 } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-apple-border/50 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-apple-accent text-white shadow-apple-sm">
            <Music2 size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-apple-text">GarageBand Arranger</h1>
            <p className="text-xs text-apple-muted">AI-powered music project generator</p>
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
