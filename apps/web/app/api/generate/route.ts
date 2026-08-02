import { NextRequest, NextResponse } from 'next/server';
import { buildConfig } from '@/lib/music';
import { generateMidi } from '@/lib/midi';
import { generateRpp } from '@/lib/rpp';
import { GenerationRequest, GeneratedProject, ProjectFile, MusicConfig } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json();
    const {
      description,
      style,
      bpm,
      bars,
      key,
      scale,
      outputType,
    } = body;

    const configData = buildConfig(description, { bpm, bars, key, scale, style });
    const config: MusicConfig = {
      ...configData,
      description,
    };

    const id = `project_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const files: ProjectFile[] = [];

    if (outputType === 'mid') {
      const midiBase64 = generateMidi(config);
      files.push({
        name: `${id}.mid`,
        type: 'mid',
        content: midiBase64,
        size: Math.ceil((midiBase64.length * 3) / 4),
      });
    } else {
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

    const project: GeneratedProject = {
      id,
      name: id,
      createdAt: timestamp,
      config,
      files,
    };

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
