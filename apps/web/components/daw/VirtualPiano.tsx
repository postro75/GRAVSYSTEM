'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, Square, Circle, Usb } from 'lucide-react';
import { Region } from '@gravsystem/core';

export interface VirtualPianoProps {
  selectedRegion?: Region | null;
  getRecordPosition?: () => number;
  onPreview?: (pitch: number, velocity: number) => void;
  onRecordNote?: (note: { pitch: number; velocity: number; start: number; duration: number }) => void;
}

const START_OCTAVE = 3;
const OCTAVES = 2;

const KEYBOARD_MAP: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, ';': 16, "'": 17,
};

function noteName(note: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(note / 12) - 1;
  return `${names[note % 12]}${octave}`;
}

export function VirtualPiano({ selectedRegion, getRecordPosition, onPreview, onRecordNote }: VirtualPianoProps) {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [midiDevices, setMidiDevices] = useState(0);
  const heldRef = useRef<Set<number>>(new Set());
  const recordingNotesRef = useRef<Map<number, { start: number; velocity: number }>>(new Map());
  const midiAccessRef = useRef<MIDIAccess | null>(null);

  const recordNoteOn = useCallback(
    (pitch: number, velocity: number) => {
      if (!selectedRegion || !isRecording) return;
      const start = getRecordPosition ? getRecordPosition() : 0;
      recordingNotesRef.current.set(pitch, { start: Math.max(0, start), velocity });
    },
    [selectedRegion, isRecording, getRecordPosition]
  );

  const recordNoteOff = useCallback(
    (pitch: number) => {
      if (!selectedRegion || !isRecording) return;
      const note = recordingNotesRef.current.get(pitch);
      if (!note) return;
      const end = getRecordPosition ? getRecordPosition() : note.start + 0.5;
      const duration = Math.max(0.05, end - note.start);
      onRecordNote?.({
        pitch,
        velocity: note.velocity,
        start: note.start,
        duration,
      });
      recordingNotesRef.current.delete(pitch);
    },
    [selectedRegion, isRecording, getRecordPosition, onRecordNote]
  );

  const startNote = useCallback(
    (pitch: number, velocity = 100) => {
      if (heldRef.current.has(pitch)) return;
      heldRef.current.add(pitch);
      setActiveNotes(new Set(heldRef.current));
      onPreview?.(pitch, velocity);
      recordNoteOn(pitch, velocity);
    },
    [onPreview, recordNoteOn]
  );

  const stopNote = useCallback(
    (pitch: number) => {
      if (!heldRef.current.has(pitch)) return;
      heldRef.current.delete(pitch);
      setActiveNotes(new Set(heldRef.current));
      recordNoteOff(pitch);
    },
    [recordNoteOff]
  );

  // Web MIDI support
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) return;

    let cancelled = false;
    navigator
      .requestMIDIAccess({ sysex: false })
      .then((access) => {
        if (cancelled) return;
        midiAccessRef.current = access;
        setMidiDevices(access.inputs.size);

        const handleMessage = (evt: MIDIMessageEvent) => {
          const data = evt.data;
          if (!data || data.length < 3) return;
          const status = data[0] & 0xf0;
          const pitch = data[1];
          const velocity = data[2];

          if (status === 0x90 && velocity > 0) {
            startNote(pitch, velocity);
          } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
            stopNote(pitch);
          }
        };

        access.inputs.forEach((input) => {
          input.onmidimessage = handleMessage;
        });

        access.onstatechange = () => {
          setMidiDevices(access.inputs.size);
          access.inputs.forEach((input) => {
            if (!input.onmidimessage) input.onmidimessage = handleMessage;
          });
        };
      })
      .catch(() => {
        // MIDI access denied or unsupported — ignore gracefully.
      });

    return () => {
      cancelled = true;
      midiAccessRef.current?.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
    };
  }, [startNote, stopNote]);

  // Computer keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const offset = KEYBOARD_MAP[e.key.toLowerCase()];
      if (offset === undefined) return;
      const pitch = START_OCTAVE * 12 + offset;
      if (pitch >= 0 && pitch <= 127) {
        e.preventDefault();
        startNote(pitch, 100);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const offset = KEYBOARD_MAP[e.key.toLowerCase()];
      if (offset === undefined) return;
      const pitch = START_OCTAVE * 12 + offset;
      if (pitch >= 0 && pitch <= 127) {
        e.preventDefault();
        stopNote(pitch);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startNote, stopNote]);

  const whiteKeys: number[] = [];
  for (let oct = 0; oct < OCTAVES; oct++) {
    const base = START_OCTAVE * 12 + oct * 12;
    [0, 2, 4, 5, 7, 9, 11].forEach((n) => whiteKeys.push(base + n));
  }

  return (
    <div className="flex h-full flex-col bg-apple-bg p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold text-apple-text">Virtual Piano</div>
        <div className="flex items-center gap-2">
          {midiDevices > 0 && (
            <div className="flex items-center gap-1 rounded-apple-sm border border-apple-border bg-apple-surface px-2 py-1 text-[10px] text-apple-muted">
              <Usb size={10} />
              MIDI {midiDevices}
            </div>
          )}
          <button
            onClick={() => setIsRecording((v) => !v)}
            disabled={!selectedRegion}
            className={`flex items-center gap-1.5 rounded-apple-sm px-3 py-1.5 text-xs font-medium transition ${
              isRecording
                ? 'bg-apple-danger text-white'
                : 'border border-apple-border bg-apple-surface text-apple-text hover:bg-apple-surface-raised'
            } disabled:opacity-40`}
          >
            {isRecording ? <Square size={12} /> : <Circle size={12} className="fill-current" />}
            {isRecording ? 'Stop' : 'Record'}
          </button>
          <div className="text-[10px] text-apple-muted">
            {selectedRegion ? selectedRegion.name : 'Select a region'}
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 select-none overflow-x-auto rounded-apple-sm border border-apple-border bg-apple-surface p-1">
        <div className="relative flex h-full">
          {whiteKeys.map((note) => (
            <button
              key={note}
              type="button"
              onMouseDown={() => startNote(note, 100)}
              onMouseUp={() => stopNote(note)}
              onMouseLeave={() => stopNote(note)}
              onTouchStart={() => startNote(note, 100)}
              onTouchEnd={() => stopNote(note)}
              className={`relative flex h-full w-10 flex-col justify-end border-r border-apple-border pb-1 text-[9px] transition ${
                activeNotes.has(note)
                  ? 'bg-apple-accent text-white'
                  : 'bg-apple-bg text-apple-muted hover:bg-white/5'
              }`}
            >
              <span className="w-full text-center">{noteName(note)}</span>
            </button>
          ))}

          {/* Black keys overlay */}
          {whiteKeys.map((note, index) => {
            if (![0, 1, 3, 4, 5].includes(note % 12)) return null;
            const blackNote = note + 1;
            return (
              <button
                key={blackNote}
                type="button"
                onMouseDown={() => startNote(blackNote, 100)}
                onMouseUp={() => stopNote(blackNote)}
                onMouseLeave={() => stopNote(blackNote)}
                onTouchStart={() => startNote(blackNote, 100)}
                onTouchEnd={() => stopNote(blackNote)}
                style={{ left: `${(index + 1) * 40 - 12}px` }}
                className={`absolute top-0 z-10 h-[60%] w-6 rounded-b-sm text-[8px] transition ${
                  activeNotes.has(blackNote)
                    ? 'bg-apple-accent text-white'
                    : 'bg-apple-text text-apple-bg hover:bg-apple-muted'
                }`}
              >
                <span className="absolute bottom-1 left-0 right-0 text-center">{noteName(blackNote)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[10px] text-apple-muted">
        <Mic size={12} />
        <span>
          Use keyboard keys A–L or a MIDI controller. Recording writes notes at the current playhead.
        </span>
      </div>
    </div>
  );
}
