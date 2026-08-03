import { Midi } from '@tonejs/midi';
import { Project } from '@gravsystem/core';

export function projectToMidiBytes(project: Project): Uint8Array {
  const midi = new Midi();
  midi.header.name = project.title;
  midi.header.tempos.push({
    bpm: project.bpm,
    ticks: 0,
    time: 0,
  });
  midi.header.timeSignatures.push({
    ticks: 0,
    timeSignature: project.timeSignature,
    measures: 0,
  });

  for (const track of project.tracks) {
    const midiTrack = midi.addTrack();
    midiTrack.name = track.name;
    midiTrack.channel = Math.max(0, Math.min(15, track.channel - 1));

    for (const region of track.regions) {
      const regionStartSeconds = (region.startBeat / project.bpm) * 60;

      for (const evt of region.midiEvents) {
        const startSeconds = regionStartSeconds + (evt.start / project.bpm) * 60;
        const durationSeconds = (evt.duration / project.bpm) * 60;
        midiTrack.addNote({
          midi: evt.pitch,
          time: startSeconds,
          duration: Math.max(0.01, durationSeconds),
          velocity: Math.max(0, Math.min(1, evt.velocity / 127)),
        });
      }
    }
  }

  return new Uint8Array(midi.toArray());
}

export function downloadMidi(project: Project) {
  const bytes = projectToMidiBytes(project);
  const blob = new Blob([bytes.buffer.slice(0) as ArrayBuffer], { type: 'audio/midi' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/\s+/g, '_')}.mid`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
