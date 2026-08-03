import {
  Drum,
  AudioWaveform,
  Guitar,
  Music2,
  Radio,
  Sparkles,
  Zap,
  Mic2,
  Keyboard,
  Layers,
  CircleDot,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TrackStyle {
  color: string;
  bg: string;
  icon: LucideIcon;
}

const TRACK_STYLES: Record<string, TrackStyle> = {
  drums: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: Drum },
  kick: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: Drum },
  hat: { color: '#f97316', bg: 'rgba(249,115,22,0.15)', icon: AudioWaveform },
  bass: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: Guitar },
  arpeggio: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)', icon: Zap },
  pad: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: Layers },
  string: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', icon: Music2 },
  drone: { color: '#818cf8', bg: 'rgba(129,140,248,0.15)', icon: Radio },
  chords: { color: '#a855f7', bg: 'rgba(168,85,247,0.15)', icon: Keyboard },
  stab: { color: '#d946ef', bg: 'rgba(217,70,239,0.15)', icon: Sparkles },
  lead: { color: '#ec4899', bg: 'rgba(236,72,153,0.15)', icon: Mic2 },
  fx: { color: '#14b8a6', bg: 'rgba(20,184,166,0.15)', icon: Sparkles },
  vocal: { color: '#f43f5e', bg: 'rgba(244,63,94,0.15)', icon: Mic2 },
};

export function trackStyle(name: string): TrackStyle {
  const lowered = name.toLowerCase();
  for (const [key, style] of Object.entries(TRACK_STYLES)) {
    if (lowered.includes(key)) return style;
  }
  return { color: '#9ca3af', bg: 'rgba(156,163,175,0.15)', icon: CircleDot };
}
