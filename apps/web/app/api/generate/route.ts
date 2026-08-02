import { NextRequest, NextResponse } from 'next/server';
import { generateProjectFromDescription } from '@/lib/generator';
import { generateMidi } from '@/lib/midi';
import { buildConfig } from '@/lib/music';
import { GenerationRequest, MusicConfig } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();
    const { description, style, bpm, bars, key, scale, outputType } = body;

    const project = generateProjectFromDescription({
      description,
      style,
      bpm,
      bars,
      key,
      scale,
    });

    // Backward-compatible file generation for classic export
    const configData = buildConfig(description, { bpm, bars, key, scale, style });
    const config: MusicConfig = { ...configData, description };
    const id = `project_${Date.now()}`;
    const files: { name: string; type: 'rpp' | 'mid' | 'wav'; content: string; size: number }[] = [];

    if (outputType === 'mid' || !outputType) {
      const midiBase64 = generateMidi(config);
      files.push({
        name: `${id}.mid`,
        type: 'mid',
        content: midiBase64,
        size: Math.ceil((midiBase64.length * 3) / 4),
      });
    }
    if (outputType === 'rpp') {
      const { generateRpp } = await import('@/lib/rpp');
      const rppContent = generateRpp(config);
      files.push({
        name: `${id}.rpp`,
        type: 'rpp',
        content: rppContent,
        size: new TextEncoder().encode(rppContent).length,
      });
      const midiBase64 = generateMidi(config);
      files.push({
        name: `${id}.mid`,
        type: 'mid',
        content: midiBase64,
        size: Math.ceil((midiBase64.length * 3) / 4),
      });
    }

    return NextResponse.json({
      success: true,
      project,
      config,
      files,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
