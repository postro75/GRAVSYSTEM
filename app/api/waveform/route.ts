import { NextRequest, NextResponse } from 'next/server';
import { MusicConfig } from '@/lib/types';
import { generateWav } from '@/lib/wav';

export async function POST(request: NextRequest) {
  try {
    const { config }: { config: MusicConfig } = await request.json();
    const wavBase64 = generateWav(config);

    return NextResponse.json({ success: true, wav: wavBase64 });
  } catch (error) {
    console.error('Waveform error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
