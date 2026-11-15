import { Project } from '@gravsystem/core';

export interface BackendWavResult {
  type: 'wav';
  blob: Blob;
  filename: string;
}

export interface BackendMidiResult {
  type: 'midi';
  blob: Blob;
  filename: string;
  diagnostic: string;
}

export type BackendRenderResult = BackendWavResult | BackendMidiResult;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function renderProjectOnBackend(project: Project): Promise<BackendRenderResult> {
  const response = await fetch('/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Render failed: ${response.status} ${text}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  const filename =
    response.headers.get('Content-Disposition')?.match(/filename="?([^"]+)"?/)?.[1] ??
    `${project.title.replace(/\s+/g, '_')}.wav`;

  if (contentType.includes('audio/wav')) {
    const blob = await response.blob();
    return { type: 'wav', blob, filename };
  }

  const data = await response.json();
  if (!data.success && data.midi) {
    const midiBytes = Uint8Array.from(atob(data.midi), (c) => c.charCodeAt(0));
    const blob = new Blob([midiBytes], { type: 'audio/midi' });
    return {
      type: 'midi',
      blob,
      filename: data.filename ?? `${project.title.replace(/\s+/g, '_')}.mid`,
      diagnostic: data.diagnostic ?? 'Backend render returned MIDI fallback.',
    };
  }

  throw new Error(data.error ?? 'Unexpected render response');
}

export function downloadRenderResult(result: BackendRenderResult) {
  downloadBlob(result.blob, result.filename);
}
