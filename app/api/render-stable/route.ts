import { NextRequest, NextResponse } from 'next/server';
import { MusicConfig } from '@/lib/types';

interface StableAudioRequest {
  config: MusicConfig;
}

function buildPrompt(config: MusicConfig): string {
  const styleDesc: Record<string, string> = {
    jarre: 'ambient electronic space music in the style of Jean-Michel Jarre, analog synthesizers, arpeggios, warm pads',
    synthwave: 'synthwave, 80s retro, neon, driving bass, analog synths, Kavinsky style',
    dance: 'energetic EDM dance, four-on-floor kick, big room, David Guetta style',
    ambient: 'ambient space music, drones, ethereal pads, slow evolving textures',
    techno: 'dark techno club, driving kick, industrial, minimal synth stabs',
    electro: 'electro house, punchy bass, bright leads',
    house: 'deep house, groovy bassline, warm chords',
  };

  const base = styleDesc[config.style] || styleDesc.dance;
  return `${base}, ${config.bpm} BPM, ${config.key} ${config.scale}, ${config.bars} bars, instrumental, high quality production`;
}

export async function POST(request: NextRequest) {
  try {
    const body: StableAudioRequest = await request.json();
    const { config } = body;

    const apiKey = process.env.STABLE_AUDIO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'STABLE_AUDIO_API_KEY not configured' },
        { status: 503 }
      );
    }

    const duration = Math.min(180, Math.max(5, config.bars * 4 * (60 / config.bpm)));
    const prompt = buildPrompt(config);

    const form = new FormData();
    form.append('prompt', prompt);
    form.append('duration', String(Math.round(duration)));
    form.append('cfg_scale', '7');
    form.append('seed', String(Math.floor(Math.random() * 2147483647)));

    const res = await fetch('https://api.stability.ai/v2beta/stable-audio/generation', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'audio/wav',
      },
      body: form,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { success: false, error: `Stable Audio API error ${res.status}: ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const base64 = buffer.toString('base64');

    return NextResponse.json({
      success: true,
      wav: base64,
      duration,
      prompt,
    });
  } catch (error) {
    console.error('Stable Audio render error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
