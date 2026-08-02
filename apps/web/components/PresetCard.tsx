import { Preset } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Music, Disc3, Zap, Wind, Sparkles } from 'lucide-react';

const icons: Record<string, React.ReactNode> = {
  'jarre-oxygene': <Music size={18} />,
  'kavinsky-drive': <Disc3 size={18} />,
  'guetta-dance': <Zap size={18} />,
  'ambient-space': <Wind size={18} />,
  'techno-club': <Sparkles size={18} />,
};

interface PresetCardProps {
  preset: Preset;
  selected: boolean;
  onClick: () => void;
}

export function PresetCard({ preset, selected, onClick }: PresetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-apple-sm text-left shadow-apple-sm ring-1 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-accent focus-visible:ring-offset-2',
        selected
          ? 'ring-apple-accent shadow-apple scale-[1.02]'
          : 'ring-apple-border hover:shadow-apple hover:ring-apple-accent/50 hover:scale-[1.01]'
      )}
    >
      {/* Background photo */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={preset.imageUrl}
          alt={preset.label}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-apple-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Icon badge */}
      <div
        className={cn(
          'absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-colors',
          selected
            ? 'bg-apple-accent text-white'
            : 'bg-white/90 text-apple-accent group-hover:bg-white'
        )}
      >
        {icons[preset.id] || <Music size={16} />}
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute right-3 top-3 flex h-6 items-center justify-center rounded-full bg-apple-accent px-2.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
          Active
        </div>
      )}

      {/* Text content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-sm font-semibold text-white shadow-black drop-shadow-md">
          {preset.label}
        </h3>
        <p className="mt-0.5 text-xs text-white/80 line-clamp-2">
          {preset.bpm} BPM · {preset.key} {preset.scale} · {preset.bars} bars
        </p>
      </div>
    </button>
  );
}
