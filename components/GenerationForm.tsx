'use client';

import { useState } from 'react';
import { Preset, GenerationRequest } from '@/lib/types';
import { DEFAULT_PRESET, STYLE_PRESETS } from '@/lib/presets';
import { PresetCard } from './PresetCard';
import {
  Loader2,
  Wand2,
  AlignLeft,
  Activity,
  Ruler,
  KeyRound,
  Music2,
  Palette,
  FileOutput,
} from 'lucide-react';

interface GenerationFormProps {
  onGenerate: (request: GenerationRequest) => Promise<void>;
  isGenerating: boolean;
}

const Label = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <label className="label inline-flex items-center gap-1.5">
    <span className="text-apple-accent">{icon}</span>
    {children}
  </label>
);

export function GenerationForm({ onGenerate, isGenerating }: GenerationFormProps) {
  const [selectedPreset, setSelectedPreset] = useState<Preset>(DEFAULT_PRESET);
  const [description, setDescription] = useState(DEFAULT_PRESET.description);
  const [bpm, setBpm] = useState(DEFAULT_PRESET.bpm);
  const [bars, setBars] = useState(DEFAULT_PRESET.bars);
  const [key, setKey] = useState(DEFAULT_PRESET.key);
  const [scale, setScale] = useState<'major' | 'minor'>(DEFAULT_PRESET.scale);
  const [style, setStyle] = useState(DEFAULT_PRESET.style);
  const [outputType, setOutputType] = useState<'rpp' | 'mid'>('rpp');

  const applyPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setDescription(preset.description);
    setBpm(preset.bpm);
    setBars(preset.bars);
    setKey(preset.key);
    setScale(preset.scale);
    setStyle(preset.style);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGenerate({
      description,
      style,
      bpm,
      bars,
      key,
      scale,
      outputType,
      addFx: false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6">
      <div>
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-apple-muted">
          <Palette size={16} className="text-apple-accent" />
          Quick style presets
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {STYLE_PRESETS.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              selected={selectedPreset.id === preset.id}
              onClick={() => applyPreset(preset)}
            />
          ))}
        </div>
      </div>

      <div className="h-px bg-apple-border/60" />

      <div>
        <Label icon={<AlignLeft size={14} />}>Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="input resize-none"
          placeholder="Describe your track in Polish or English..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <Label icon={<Activity size={14} />}>BPM</Label>
          <input
            id="bpm"
            type="number"
            min={60}
            max={200}
            value={bpm}
            onChange={(e) => setBpm(Math.max(60, Math.min(200, Number(e.target.value))))}
            className="input"
          />
        </div>

        <div>
          <Label icon={<Ruler size={14} />}>Bars</Label>
          <input
            id="bars"
            type="number"
            min={8}
            max={64}
            step={4}
            value={bars}
            onChange={(e) => setBars(Math.max(8, Math.min(64, Number(e.target.value))))}
            className="input"
          />
        </div>

        <div>
          <Label icon={<KeyRound size={14} />}>Key</Label>
          <select id="key" value={key} onChange={(e) => setKey(e.target.value)} className="input">
            {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        <div>
          <Label icon={<Music2 size={14} />}>Scale</Label>
          <select id="scale" value={scale} onChange={(e) => setScale(e.target.value as 'major' | 'minor')} className="input">
            <option value="minor">Minor</option>
            <option value="major">Major</option>
          </select>
        </div>

        <div>
          <Label icon={<Palette size={14} />}>Style</Label>
          <select id="style" value={style} onChange={(e) => setStyle(e.target.value)} className="input">
            <option value="jarre">Jarre</option>
            <option value="synthwave">Synthwave</option>
            <option value="dance">Dance</option>
            <option value="ambient">Ambient</option>
            <option value="techno">Techno</option>
            <option value="electro">Electro</option>
            <option value="house">House</option>
          </select>
        </div>

        <div>
          <Label icon={<FileOutput size={14} />}>Output</Label>
          <select id="output" value={outputType} onChange={(e) => setOutputType(e.target.value as 'rpp' | 'mid')} className="input">
            <option value="rpp">REAPER Project</option>
            <option value="mid">MIDI File</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isGenerating}
          className="btn-primary min-w-[180px] gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 size={16} />
              Generate project
            </>
          )}
        </button>
      </div>
    </form>
  );
}
