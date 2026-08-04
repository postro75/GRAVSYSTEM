import * as Tone from 'tone';
import { Soundfont } from 'smplr';
import { Project, Track, MidiEvent } from '@gravsystem/core';
import { SynthDrumKit, SampleDrumKit } from './drum-kit';
import {
  createCustomSynth,
  getInstrumentById,
  inferInstrumentForTrack,
  type InstrumentDefinition,
} from './instruments';

export interface AudioEngineState {
  isPlaying: boolean;
  isReady: boolean;
  loading: boolean;
  error: string | null;
}

export type PlayableInstrument =
  | Tone.PolySynth
  | Tone.MonoSynth
  | Tone.DuoSynth
  | Tone.FMSynth
  | Tone.AMSynth
  | Soundfont;

function isDrumTrackName(name: string): boolean {
  const lowered = name.toLowerCase();
  return (
    lowered.includes('drum') ||
    lowered.includes('kick') ||
    lowered.includes('snare') ||
    lowered.includes('hat') ||
    lowered.includes('clap')
  );
}

function isDrumTrack(track: Track): boolean {
  return track.instrumentType === 'drums' || isDrumTrackName(track.name);
}

interface TrackChannel {
  gain: Tone.Gain;
  panner: Tone.Panner;
  mute: boolean;
  solo: boolean;
}

export class AudioEngine {
  private project: Project | null = null;
  private onStateChange?: (state: AudioEngineState) => void;
  private isStarted = false;
  private parts: Tone.Part[] = [];
  private instruments: Map<string, PlayableInstrument> = new Map();
  private drumKit?: SynthDrumKit | SampleDrumKit;
  private effects: Tone.ToneAudioNode[] = [];
  private sidechainGains: Map<string, Tone.Gain> = new Map();
  private trackChannels: Map<string, TrackChannel> = new Map();
  private loadingCount = 0;
  private loadedCount = 0;
  private metronome?: Tone.MembraneSynth;
  private metronomePart?: Tone.Part;
  private metronomeEnabled = false;

  constructor(onStateChange?: (state: AudioEngineState) => void) {
    this.onStateChange = onStateChange;
  }

  private emit(partial: Partial<AudioEngineState>) {
    this.onStateChange?.({
      isPlaying: false,
      isReady: false,
      loading: this.loadingCount > 0,
      error: null,
      ...partial,
    });
  }

  async init() {
    try {
      await Tone.start();
      this.isStarted = true;

      // Master effects chain: time effects -> EQ -> dynamics -> safety limiter
      const limiter = new Tone.Limiter(-0.5).toDestination();
      const compressor = new Tone.Compressor(-20, 3.5).connect(limiter);
      const eq = new Tone.EQ3({
        low: -2,
        mid: 1.5,
        high: -1,
        lowFrequency: 250,
        highFrequency: 4000,
      }).connect(compressor);
      const reverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.02, wet: 0.25 }).connect(eq);
      const delay = new Tone.FeedbackDelay('8n.', 0.28).connect(reverb);
      const chorus = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0.35 }).connect(delay);
      this.effects = [chorus, delay, reverb, eq, compressor, limiter];

      // Metronome
      this.metronome = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
        volume: -12,
      }).connect(limiter);

      this.emit({ isReady: true });
    } catch (err) {
      this.emit({ error: err instanceof Error ? err.message : 'Audio engine init failed' });
    }
  }

  async resumeAudio() {
    if (this.isStarted) return;
    try {
      await Tone.start();
      this.isStarted = true;
      this.emit({ isReady: true });
    } catch (err) {
      this.emit({ error: err instanceof Error ? err.message : 'Audio engine resume failed' });
    }
  }

  async loadProject(project: Project) {
    if (!this.isStarted) return;
    this.emit({ loading: true, isReady: false });
    this.disposeParts();
    this.project = project;

    try {
      await this.loadInstruments(project);
      this.scheduleProject(project);
      Tone.Transport.bpm.value = project.bpm;
      const totalSeconds = project.bars * 4 * (60 / project.bpm);
      Tone.Transport.loop = true;
      Tone.Transport.loopStart = 0;
      Tone.Transport.loopEnd = totalSeconds;
      this.emit({ isReady: true, loading: false });
    } catch (err) {
      this.emit({
        error: err instanceof Error ? err.message : 'Project load failed',
        loading: false,
      });
    }
  }

  private resetLoading(total: number) {
    this.loadingCount = total;
    this.loadedCount = 0;
    this.emit({ loading: total > 0 });
  }

  private markLoaded() {
    this.loadedCount += 1;
    if (this.loadedCount >= this.loadingCount) {
      this.loadingCount = 0;
      this.emit({ loading: false });
    } else {
      this.emit({ loading: true });
    }
  }

  private createTrackChannel(track: Track): TrackChannel {
    const channel: TrackChannel = {
      gain: new Tone.Gain(track.volume ?? 1),
      panner: new Tone.Panner(track.pan ?? 0),
      mute: track.mute ?? false,
      solo: track.solo ?? false,
    };
    channel.gain.connect(channel.panner);
    this.trackChannels.set(track.id, channel);
    return channel;
  }

  private applySoloState() {
    const anySolo = Array.from(this.trackChannels.values()).some((ch) => ch.solo);
    for (const channel of this.trackChannels.values()) {
      const targetMute = channel.mute || (anySolo && !channel.solo);
      channel.gain.gain.setTargetAtTime(targetMute ? 0 : 1, Tone.now(), 0.02);
    }
  }

  updateTrack(trackId: string, updates: Partial<Pick<Track, 'volume' | 'pan' | 'mute' | 'solo'>>) {
    const channel = this.trackChannels.get(trackId);
    if (!channel) return;

    if (updates.volume !== undefined) {
      channel.gain.gain.setTargetAtTime(Math.max(0, Math.min(2, updates.volume)), Tone.now(), 0.02);
    }
    if (updates.pan !== undefined) {
      channel.panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, updates.pan)), Tone.now(), 0.02);
    }
    if (updates.mute !== undefined) {
      channel.mute = updates.mute;
      this.applySoloState();
    }
    if (updates.solo !== undefined) {
      channel.solo = updates.solo;
      this.applySoloState();
    }
  }

  private resolveInstrumentDefinition(track: Track): InstrumentDefinition {
    const fallbackId = inferInstrumentForTrack(track.name, this.project?.style ?? 'dance');
    const id = track.instrument || fallbackId;
    return getInstrumentById(id) ?? getInstrumentById(fallbackId)!;
  }

  private async loadInstrumentForTrack(
    track: Track,
    channel: TrackChannel,
    compressor: Tone.Compressor
  ): Promise<PlayableInstrument | null> {
    const def = this.resolveInstrumentDefinition(track);

    if (def.type === 'drums') {
      // Drum kit is created once per project load above.
      return null;
    }

    const sidechainGain = new Tone.Gain(1).connect(compressor);
    this.sidechainGains.set(track.id, sidechainGain);

    if (def.type === 'custom') {
      const synth = createCustomSynth(def.id);
      synth.connect(channel.gain);
      channel.gain.connect(channel.panner);
      channel.panner.connect(sidechainGain);
      return synth;
    }

    // Soundfont
    const context = Tone.context.rawContext as AudioContext;
    const soundfont = new Soundfont(context, {
      instrument: def.config,
      kit: 'FluidR3_GM',
      volume: 100,
    });
    await soundfont.load;
    (soundfont.output as unknown as AudioNode).connect(channel.gain as unknown as AudioNode);
    channel.gain.connect(channel.panner);
    channel.panner.connect(sidechainGain);
    return soundfont;
  }

  private async loadInstruments(project: Project) {
    // Dispose old instruments and channels
    for (const inst of this.instruments.values()) {
      if ('output' in inst && inst.output) {
        try { inst.output.disconnect(); } catch { /* noop */ }
      }
      if ('dispose' in inst && typeof inst.dispose === 'function') {
        try { inst.dispose(); } catch { /* noop */ }
      }
    }
    this.instruments.clear();
    for (const gain of this.sidechainGains.values()) {
      gain.dispose();
    }
    this.sidechainGains.clear();
    for (const channel of this.trackChannels.values()) {
      channel.gain.dispose();
      channel.panner.dispose();
    }
    this.trackChannels.clear();
    this.drumKit?.dispose();
    this.drumKit = undefined;

    for (const track of project.tracks) {
      this.createTrackChannel(track);
    }

    // Pre-create the shared drum kit if any drum track exists.
    const drumTrack = project.tracks.find((t) => isDrumTrack(t));
    if (drumTrack) {
      const drumDef = this.resolveInstrumentDefinition(drumTrack);
      this.drumKit = drumDef.id === 'sample-drums' ? new SampleDrumKit() : new SynthDrumKit();
    }

    const melodicTracks = project.tracks.filter((t) => !isDrumTrack(t));
    this.resetLoading(melodicTracks.length);

    const compressor = this.effects.find((e) => e instanceof Tone.Compressor) as Tone.Compressor;

    for (const track of project.tracks) {
      const channel = this.trackChannels.get(track.id)!;
      const inst = await this.loadInstrumentForTrack(track, channel, compressor);
      if (inst) {
        this.instruments.set(track.id, inst);
      }
      this.markLoaded();
    }

    // Connect drum kit output to every drum track channel
    if (this.drumKit) {
      for (const track of project.tracks) {
        if (isDrumTrack(track)) {
          const channel = this.trackChannels.get(track.id);
          if (channel) {
            this.drumKit.output.connect(channel.gain);
            channel.gain.connect(channel.panner);
          }
        }
      }
    }

    this.applySoloState();
  }

  /** Swap a track's instrument live and re-schedule playback. */
  async setInstrument(trackId: string, instrumentId: string) {
    if (!this.project) return;
    const track = this.project.tracks.find((t) => t.id === trackId);
    if (!track) return;

    track.instrument = instrumentId;
    track.instrumentType = getInstrumentById(instrumentId)?.type ?? 'custom';

    // Rebuild instruments and reschedule — simplest way to keep routing correct.
    this.disposeParts();
    await this.loadInstruments(this.project);
    this.scheduleProject(this.project);
  }

  /** Preview a single note using the selected track's current instrument. */
  previewNote(trackId: string, pitch: number, velocity = 100, duration = 0.25) {
    if (!this.isStarted) return;
    const track = this.project?.tracks.find((t) => t.id === trackId);
    if (!track) return;

    const vel = Math.max(0, Math.min(1, velocity / 127));
    const dur = Math.max(0.05, duration);

    if (isDrumTrack(track)) {
      this.drumKit?.trigger(pitch, dur, Tone.now(), vel);
      return;
    }

    const instrument = this.instruments.get(trackId);
    if (!instrument) return;

    if ('triggerAttackRelease' in instrument && typeof instrument.triggerAttackRelease === 'function') {
      instrument.triggerAttackRelease(pitch, dur, Tone.now(), vel);
    } else {
      (instrument as Soundfont).start({
        note: pitch,
        time: Tone.now(),
        duration: dur,
        velocity: Math.round(vel * 127),
      });
    }
  }

  /** Append a note to the selected region in real time (used by virtual piano recording). */
  recordNote(regionId: string, note: MidiEvent) {
    if (!this.project) return;
    const track = this.project.tracks.find((t) => t.regions.some((r) => r.id === regionId));
    if (!track) return;
    const region = track.regions.find((r) => r.id === regionId);
    if (!region) return;

    region.midiEvents.push(note);
    region.duration = Math.max(region.duration, note.start + note.duration);

    // Re-schedule so the new note is audible immediately.
    this.disposeParts();
    this.scheduleProject(this.project);
  }

  private scheduleProject(project: Project) {
    interface ScheduledNote {
      time: number;
      note: number;
      duration: number;
      velocity: number;
    }

    for (const track of project.tracks) {
      const notes: ScheduledNote[] = track.regions.flatMap((region) =>
        region.midiEvents.map((evt) => ({
          time: (evt.start / project.bpm) * 60,
          note: evt.pitch,
          duration: Math.max(0.01, (evt.duration / project.bpm) * 60),
          velocity: evt.velocity / 127,
        }))
      );

      if (isDrumTrack(track)) {
        if (notes.length === 0) continue;

        // Schedule kick separately for sidechain trigger
        const kickNotes = notes.filter((n) => n.note === 36);
        if (kickNotes.length > 0) {
          const kickPart = new Tone.Part<ScheduledNote>((time) => {
            this.sidechainGains.forEach((gain) => {
              gain.gain.cancelScheduledValues(time);
              gain.gain.setValueAtTime(1, time);
              gain.gain.exponentialRampToValueAtTime(0.45, time + 0.02);
              gain.gain.exponentialRampToValueAtTime(1, time + 0.25);
            });
          }, kickNotes);
          kickPart.start(0);
          this.parts.push(kickPart);
        }

        const part = new Tone.Part<ScheduledNote>((time, value) => {
          this.drumKit?.trigger(value.note, value.duration, time, value.velocity);
        }, notes);
        part.start(0);
        this.parts.push(part);
      } else {
        const instrument = this.instruments.get(track.id);
        if (!instrument) continue;

        const part = new Tone.Part<ScheduledNote>((time, value) => {
          const vel = Math.max(0, Math.min(1, value.velocity));
          if ('triggerAttackRelease' in instrument && typeof instrument.triggerAttackRelease === 'function') {
            instrument.triggerAttackRelease(value.note, value.duration, time, vel);
          } else {
            (instrument as Soundfont).start({
              note: value.note,
              time,
              duration: value.duration,
              velocity: Math.round(vel * 127),
            });
          }
        }, notes);
        part.start(0);
        this.parts.push(part);
      }
    }

    this.scheduleMetronome(project);
  }

  private scheduleMetronome(project: Project) {
    this.metronomePart?.dispose();
    this.metronomePart = undefined;
    if (!this.metronomeEnabled || !this.metronome) return;

    const secondsPerBeat = 60 / project.bpm;
    const totalBeats = project.bars * 4;
    const events: Array<{ time: number; accent: boolean }> = [];
    for (let beat = 0; beat < totalBeats; beat++) {
      events.push({ time: beat * secondsPerBeat, accent: beat % 4 === 0 });
    }

    this.metronomePart = new Tone.Part<{ time: number; accent: boolean }>((time, value) => {
      this.metronome?.triggerAttackRelease(value.accent ? 'C2' : 'G1', '32n', time, value.accent ? 0.9 : 0.6);
    }, events);
    this.metronomePart.start(0);
  }

  setMetronome(enabled: boolean) {
    this.metronomeEnabled = enabled;
    if (this.project) {
      this.scheduleMetronome(this.project);
    }
  }

  private disposeParts() {
    this.parts.forEach((part) => part.dispose());
    this.parts = [];
  }

  play() {
    if (!this.isStarted) return;
    Tone.Transport.start('+0.05');
    this.emit({ isPlaying: true });
  }

  pause() {
    Tone.Transport.pause();
    this.emit({ isPlaying: false });
  }

  stop() {
    Tone.Transport.stop();
    Tone.Transport.position = '0:0:0';
    this.emit({ isPlaying: false });
  }

  getPositionSeconds(): number {
    return Tone.Transport.seconds;
  }

  getPositionBeats(): number {
    return (Tone.Transport.seconds / 60) * (this.project?.bpm ?? 120);
  }

  dispose() {
    this.disposeParts();
    this.metronomePart?.dispose();
    this.metronome?.dispose();
    this.effects.forEach((eff) => eff.dispose());
    this.instruments.forEach((inst) => {
      if ('output' in inst && inst.output) {
        try { inst.output.disconnect(); } catch { /* noop */ }
      }
      if ('dispose' in inst && typeof inst.dispose === 'function') {
        try { inst.dispose(); } catch { /* noop */ }
      }
    });
    this.instruments.clear();
    this.sidechainGains.forEach((gain) => gain.dispose());
    this.sidechainGains.clear();
    this.trackChannels.forEach((channel) => {
      channel.gain.dispose();
      channel.panner.dispose();
    });
    this.trackChannels.clear();
    this.drumKit?.dispose();
    Tone.Transport.cancel(0);
  }
}
