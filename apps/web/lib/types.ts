export interface MusicConfig {
  bpm: number;
  key: string;
  scale: 'major' | 'minor';
  bars: number;
  style: string;
  chordProgression: string[];
  trackLayout: string[];
  patternTypes: Record<string, string>;
  description: string;
}

export interface Preset {
  id: string;
  label: string;
  description: string;
  imageUrl: string;
  bpm: number;
  bars: number;
  key: string;
  scale: 'major' | 'minor';
  style: string;
}

export interface GeneratedProject {
  id: string;
  name: string;
  createdAt: string;
  config: MusicConfig;
  files: ProjectFile[];
}

export interface ProjectFile {
  name: string;
  type: 'rpp' | 'mid' | 'wav';
  content: string;
  size: number;
}

export interface GenerationRequest {
  description: string;
  style: string;
  bpm?: number;
  key?: string;
  scale?: 'major' | 'minor';
  bars?: number;
  outputType: 'rpp' | 'mid';
  addFx?: boolean;
}
