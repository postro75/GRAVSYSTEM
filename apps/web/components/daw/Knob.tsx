'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  valueText?: string;
  size?: number;
  disabled?: boolean;
  title?: string;
}

const MIN_ANGLE = -135;
const MAX_ANGLE = 135;
const ANGLE_RANGE = MAX_ANGLE - MIN_ANGLE;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundToStep(value: number, step: number) {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

function valueToAngle(value: number, min: number, max: number) {
  const t = (value - min) / (max - min);
  return MIN_ANGLE + t * ANGLE_RANGE;
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function Knob({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  label,
  valueText,
  size = 48,
  disabled = false,
  title,
}: KnobProps) {
  const isDraggingRef = useRef(false);
  const startValueRef = useRef(value);
  const startYRef = useRef(0);

  const normalized = clamp(value, min, max);
  const angle = valueToAngle(normalized, min, max);

  const updateFromPointer = useCallback(
    (clientY: number) => {
      const deltaY = startYRef.current - clientY;
      const sensitivity = (max - min) / 200;
      const raw = startValueRef.current + deltaY * sensitivity;
      const stepped = roundToStep(raw, step);
      const next = clamp(stepped, min, max);
      if (next !== value) {
        onChange(next);
      }
    },
    [max, min, onChange, step, value]
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled) return;
    e.preventDefault();
    isDraggingRef.current = true;
    startValueRef.current = normalized;
    startYRef.current = e.clientY;
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      updateFromPointer(e.clientY);
    };

    const handlePointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [updateFromPointer]);

  const center = size / 2;
  const stroke = Math.max(2, size / 12);
  const radius = (size - stroke) / 2 - 2;
  const trackPath = describeArc(center, center, radius, MIN_ANGLE, MAX_ANGLE);
  const activePath = describeArc(center, center, radius, MIN_ANGLE, angle);
  const indicator = polarToCartesian(center, center, radius, angle);

  return (
    <div
      className={`flex flex-col items-center gap-1 ${disabled ? 'opacity-40' : ''}`}
      title={title}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onPointerDown={handlePointerDown}
        className={`${disabled ? 'cursor-not-allowed' : 'cursor-ns-resize'} touch-none select-none`}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={normalized}
        aria-label={label}
      >
        <path
          d={trackPath}
          fill="none"
          stroke="var(--apple-border)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d={activePath}
          fill="none"
          stroke="var(--apple-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <circle
          cx={indicator.x}
          cy={indicator.y}
          r={stroke * 1.1}
          fill="var(--apple-text)"
        />
      </svg>
      {label && <span className="text-[9px] font-medium uppercase tracking-wide text-apple-muted">{label}</span>}
      {valueText !== undefined && (
        <span className="tabular-nums text-[9px] text-apple-text">{valueText}</span>
      )}
    </div>
  );
}
