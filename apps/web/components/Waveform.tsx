'use client';

import { useEffect, useRef } from 'react';

interface WaveformProps {
  audioBase64: string;
  height?: number;
}

export function Waveform({ audioBase64, height = 96 }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const width = canvas.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Decode base64 to bytes
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Simple PCM parse (16-bit mono, skip 44-byte WAV header)
    const dataOffset = 44;
    const samples: number[] = [];
    for (let i = dataOffset; i < bytes.length - 1; i += 2) {
      const value = bytes[i] | (bytes[i + 1] << 8);
      samples.push(value >= 32768 ? value - 65536 : value);
    }

    // Downsample for bars
    const barCount = Math.min(120, Math.floor(width / 8));
    const blockSize = Math.floor(samples.length / barCount);
    const bars: number[] = [];
    for (let i = 0; i < barCount; i++) {
      let max = 0;
      const start = i * blockSize;
      const end = Math.min(start + blockSize, samples.length);
      for (let j = start; j < end; j++) {
        const abs = Math.abs(samples[j] / 32768);
        if (abs > max) max = abs;
      }
      bars.push(max);
    }

    // Draw
    ctx.clearRect(0, 0, width, height);
    const barWidth = Math.max(2, (width - (barCount - 1) * 2) / barCount);
    const centerY = height / 2;

    for (let i = 0; i < bars.length; i++) {
      const barHeight = bars[i] * (height - 16);
      const x = i * (barWidth + 2);
      const y = centerY - barHeight / 2;

      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#0071e3');
      gradient.addColorStop(1, '#5ac8fa');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
      ctx.fill();
    }
  }, [audioBase64, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height }}
      className="rounded-lg bg-apple-bg"
    />
  );
}
