'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Track,
  AutomationPoint,
  AutomationParam,
  AUTOMATION_PARAMS,
  AUTOMATION_RANGES,
} from '@gravsystem/core';
import { Activity, Trash2 } from 'lucide-react';

export interface AutomationEditorProps {
  track?: Track | null;
  bars?: number;
  onChange?: (trackId: string, points: AutomationPoint[]) => void;
}

const BEAT_WIDTH = 60;
const LANE_HEIGHT = 48;
const SNAP_BEATS = 0.25;

const PARAM_LABELS: Record<AutomationParam, string> = {
  volume: 'Volume',
  pan: 'Pan',
  cutoff: 'Filter Cutoff',
  resonance: 'Resonance',
  reverb: 'Reverb Send',
  delay: 'Delay Send',
};

function snap(value: number, step: number) {
  return Math.round(value / step) * step;
}

function timeToX(time: number) {
  return time * BEAT_WIDTH;
}

function xToTime(x: number) {
  return Math.max(0, snap(x / BEAT_WIDTH, SNAP_BEATS));
}

function valueToY(value: number, range: { min: number; max: number }) {
  const t = (value - range.min) / (range.max - range.min);
  return LANE_HEIGHT - t * LANE_HEIGHT;
}

function yToValue(y: number, range: { min: number; max: number }) {
  const t = Math.max(0, Math.min(1, (LANE_HEIGHT - y) / LANE_HEIGHT));
  return range.min + t * (range.max - range.min);
}

function interpolateValue(points: AutomationPoint[], time: number): number | undefined {
  if (points.length === 0) return undefined;
  const sorted = [...points].sort((a, b) => a.time - b.time);
  if (time <= sorted[0].time) return sorted[0].value;
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (time >= a.time && time <= b.time) {
      const t = (time - a.time) / (b.time - a.time);
      return a.value + t * (b.value - a.value);
    }
  }
  return sorted[sorted.length - 1].value;
}

export { interpolateValue };

export function AutomationEditor({ track, bars = 16, onChange }: AutomationEditorProps) {
  const [points, setPoints] = useState<AutomationPoint[]>(track?.automation ?? []);
  const [selectedParam, setSelectedParam] = useState<AutomationParam | 'all'>('all');
  const dragRef = useRef<{
    id: string;
    param: AutomationParam;
    startX: number;
    startY: number;
    startTime: number;
    startValue: number;
  } | null>(null);

  useEffect(() => {
    setPoints(track?.automation ?? []);
  }, [track]);

  const sendChange = useCallback(
    (next: AutomationPoint[]) => {
      setPoints(next);
      if (track) onChange?.(track.id, next);
    },
    [onChange, track]
  );

  const handleAdd = (param: AutomationParam, e: React.MouseEvent<HTMLDivElement>) => {
    if (!track) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const range = AUTOMATION_RANGES[param];
    const newPoint: AutomationPoint = {
      id: crypto.randomUUID(),
      param,
      time: xToTime(x),
      value: yToValue(y, range),
    };
    sendChange([...points, newPoint]);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sendChange(points.filter((p) => p.id !== id));
  };

  const handlePointerDown = (
    e: React.PointerEvent,
    point: AutomationPoint
  ) => {
    e.stopPropagation();
    e.preventDefault();
    dragRef.current = {
      id: point.id,
      param: point.param,
      startX: e.clientX,
      startY: e.clientY,
      startTime: point.time,
      startValue: point.value,
    };
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!dragRef.current || !track) return;
      const { id, startX, startY, startTime, startValue } = dragRef.current;
      const range = AUTOMATION_RANGES[dragRef.current.param];
      const dx = e.clientX - startX;
      const newTime = Math.max(0, snap(startTime + dx / BEAT_WIDTH, SNAP_BEATS));
      const newValue = Math.max(range.min, Math.min(range.max, startValue + ((startY - e.clientY) / LANE_HEIGHT) * (range.max - range.min)));

      setPoints((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, time: newTime, value: newValue } : p
        )
      );
    };

    const handleUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      // Commit current state to parent.
      setPoints((current) => {
        if (track) onChange?.(track.id, current);
        return current;
      });
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [onChange, track]);

  if (!track) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-apple-muted">
        Select a track to edit automation.
      </div>
    );
  }

  const totalBeats = bars * 4;
  const visibleParams = selectedParam === 'all' ? AUTOMATION_PARAMS : [selectedParam];

  return (
    <div className="flex h-full flex-col bg-apple-bg">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-apple-border bg-apple-surface-raised px-3">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-apple-accent" />
          <span className="text-xs font-semibold text-apple-text">Automation</span>
          <span className="text-[10px] text-apple-muted">{track.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedParam}
            onChange={(e) => setSelectedParam(e.target.value as AutomationParam | 'all')}
            className="h-6 rounded border border-apple-border bg-apple-bg px-2 text-[10px] text-apple-text focus:outline-none focus:ring-1 focus:ring-apple-accent"
          >
            <option value="all">All lanes</option>
            {AUTOMATION_PARAMS.map((p) => (
              <option key={p} value={p}>
                {PARAM_LABELS[p]}
              </option>
            ))}
          </select>
          <button
            onClick={() => sendChange([])}
            className="flex items-center gap-1 rounded border border-apple-border bg-apple-bg px-2 py-1 text-[10px] text-apple-muted transition hover:text-apple-danger"
          >
            <Trash2 size={10} />
            Clear
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto">
        <div style={{ width: totalBeats * BEAT_WIDTH }}>
          {/* Beat grid header */}
          <div className="relative h-6 border-b border-apple-border bg-apple-surface-raised">
            {Array.from({ length: totalBeats + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-apple-border pl-1 text-[9px] text-apple-muted"
                style={{ left: i * BEAT_WIDTH }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Lanes */}
          {visibleParams.map((param) => {
            const range = AUTOMATION_RANGES[param];
            const paramPoints = points
              .filter((p) => p.param === param)
              .sort((a, b) => a.time - b.time);

            return (
              <div
                key={param}
                className="relative border-b border-apple-border"
                style={{ height: LANE_HEIGHT }}
                onClick={(e) => handleAdd(param, e)}
              >
                <span className="absolute left-1 top-1 z-10 text-[9px] font-medium text-apple-muted">
                  {PARAM_LABELS[param]}
                </span>

                {/* Center line for bidirectional params */}
                {range.min < 0 && (
                  <div
                    className="absolute left-0 right-0 border-t border-white/10"
                    style={{ top: valueToY(0, range) }}
                  />
                )}

                {/* Polyline */}
                <svg className="absolute inset-0 pointer-events-none">
                  {paramPoints.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="rgba(59,130,246,0.8)"
                      strokeWidth={2}
                      points={paramPoints
                        .map((p) => `${timeToX(p.time)},${valueToY(p.value, range)}`)
                        .join(' ')}
                    />
                  )}
                  {paramPoints.map((p) => (
                    <circle
                      key={p.id}
                      cx={timeToX(p.time)}
                      cy={valueToY(p.value, range)}
                      r={4}
                      fill="#3b82f6"
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </svg>

                {/* Interactive handles */}
                {paramPoints.map((p) => (
                  <button
                    key={`handle-${p.id}`}
                    type="button"
                    onPointerDown={(e) => handlePointerDown(e, p)}
                    onContextMenu={(e) => handleDelete(p.id, e)}
                    className="absolute z-20 h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full bg-apple-accent ring-1 ring-white active:cursor-grabbing"
                    style={{
                      left: timeToX(p.time),
                      top: valueToY(p.value, range),
                    }}
                    title={`${PARAM_LABELS[param]}: ${p.value.toFixed(2)} @ beat ${p.time.toFixed(2)}`}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex h-7 shrink-0 items-center border-t border-apple-border bg-apple-surface-raised px-3 text-[10px] text-apple-muted">
        Click lane to add · Drag point to move · Right-click point to delete
      </div>
    </div>
  );
}
