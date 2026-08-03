import * as Tone from 'tone';
import { Soundfont } from 'smplr';
import { Project, Track } from '@gravsystem/core';
import { SynthDrumKit } from './drum-kit';

export interface AudioEngineState {
  isPlaying: boolean;
  isReady: boolean;
  loading: boolean;
  error: string | null;
}

const GM_INSTRUMENTS: Record<string, string> = {
  bass: 'synth_bass_1',
  pad: 'pad_2_warm',
  string: 'synth_strings_1',
  drone: 'choir_aahs',
  arpeggio: 'marimba',
  chords: 'electric_piano_1',
  stab: 'synth_brass_1',
  lead: 'lead_2_sawtooth',
  fx: 'fx_8_scifi',
};

function instrumentForTrack(trackName: string): string {
  const name = trackName.toLowerCase();
  for (const [key, value] of Object.entries(GM_INSTRUMENTS)) {
    if (name.includes(key)) return value;
  }
  return 'synth_strings_1';
}

function createSynthForTrack(trackName: string, style: string): Tone.PolySynth | Tone.MonoSynth | Tone.DuoSynth | Tone.FMSynth {
  const name = trackName.toLowerCase();
  const s = style.toLowerCase();
  const isJarre = s === 'jarre' || s === 'ambient';
  const isSynthwave = s === 'synthwave';
  const isDance = s === 'dance' || s === 'electro' || s === 'house' || s === 'edm';

  if (name.includes('bass')) {
    if (isJarre) {
      return new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.02, decay: 0.35, sustain: 0.5, release: 0.6 },
        filterEnvelope: { attack: 0.05, decay: 0.4, sustain: 0.35, release: 0.6, baseFrequency: 60, octaves: 3, exponent: 2 },
        filter: { Q: 1.5, type: 'lowpass', rolloff: -24 },
      });
    }
    if (isSynthwave) {
      return new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.005, decay: 0.25, sustain: 0.7, release: 0.5 },
        filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.5, release: 0.4, baseFrequency: 100, octaves: 2.5, exponent: 2 },
        filter: { Q: 2.5, type: 'lowpass', rolloff: -24 },
      });
    }
    return new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.005, decay: 0.18, sustain: 0.65, release: 0.35 },
      filterEnvelope: { attack: 0.005, decay: 0.15, sustain: 0.4, release: 0.3, baseFrequency: 90, octaves: 2.5, exponent: 2 },
      filter: { Q: 2.2, type: 'lowpass', rolloff: -24 },
    });
  }

  if (name.includes('lead')) {
    if (isJarre) {
      return new Tone.DuoSynth({
        vibratoAmount: 0.15,
        vibratoRate: 4,
        harmonicity: 1.25,
        voice0: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.08, decay: 0.2, sustain: 0.75, release: 0.8 }, filterEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 0.8, baseFrequency: 350, octaves: 2.5 } },
        voice1: { oscillator: { type: 'triangle' }, envelope: { attack: 0.08, decay: 0.2, sustain: 0.75, release: 0.8 }, filterEnvelope: { attack: 0.1, decay: 0.3, sustain: 0.6, release: 0.8, baseFrequency: 350, octaves: 2.5 } },
      });
    }
    if (isSynthwave) {
      return new Tone.DuoSynth({
        vibratoAmount: 0.05,
        vibratoRate: 6,
        harmonicity: 1.5,
        voice0: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5 }, filterEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5, baseFrequency: 600, octaves: 2 } },
        voice1: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5 }, filterEnvelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5, baseFrequency: 600, octaves: 2 } },
      });
    }
    return new Tone.DuoSynth({
      vibratoAmount: 0.08,
      vibratoRate: 5,
      harmonicity: 1.5,
      voice0: { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.03, decay: 0.1, sustain: 0.75, release: 0.45 }, filterEnvelope: { attack: 0.03, decay: 0.1, sustain: 0.75, release: 0.45, baseFrequency: 450, octaves: 2 } },
      voice1: { oscillator: { type: 'square' }, envelope: { attack: 0.03, decay: 0.1, sustain: 0.75, release: 0.45 }, filterEnvelope: { attack: 0.03, decay: 0.1, sustain: 0.75, release: 0.45, baseFrequency: 450, octaves: 2 } },
    });
  }

  if (name.includes('pad') || name.includes('string') || name.includes('drone')) {
    if (isJarre) {
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.6, decay: 0.3, sustain: 0.85, release: 2.0 },
      });
    }
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.3, decay: 0.2, sustain: 0.8, release: 1.2 },
    });
  }

  if (name.includes('arpeggio')) {
    if (isJarre) {
      return new Tone.FMSynth({
        harmonicity: 2,
        modulationIndex: 6,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.8 },
        modulation: { type: 'triangle' },
        modulationEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.5 },
      });
    }
    return new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.3 },
    });
  }

  if (name.includes('chords') || name.includes('stab')) {
    if (isDance) {
      return new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.005, decay: 0.12, sustain: 0.35, release: 0.25 },
      });
    }
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'square' },
      envelope: { attack: 0.02, decay: 0.15, sustain: 0.4, release: 0.4 },
    });
  }

  // Fallback
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.7, release: 0.5 },
  });
}

export type VoiceType = 'custom' | 'soundfont';

function voiceTypeForTrack(trackName: string): VoiceType {
  const name = trackName.toLowerCase();
  if (name.includes('bass') || name.includes('lead') || name.includes('pad') || name.includes('string') || name.includes('drone') || name.includes('arpeggio') || name.includes('chords') || name.includes('stab')) {
    return 'custom';
  }
  return 'soundfont';
}

function isDrumTrack(trackName: string): boolean {
  const name = trackName.toLowerCase();
  return name.includes('drum') || name.includes('kick') || name.includes('hat') || name.includes('clap');
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
  private instruments: Map<string, Tone.PolySynth | Tone.MonoSynth | Tone.DuoSynth | Tone.FMSynth | Soundfont> = new Map();
  private drumKit?: SynthDrumKit;
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

      // Synthesized drum kit — no external sample dependencies
      this.drumKit = new SynthDrumKit();

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

  private getDestinationForDrums() {
    return this.effects[3]; // EQ
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

  private async loadInstruments(project: Project) {
    const context = Tone.context.rawContext as AudioContext;

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

    const melodicTracks = project.tracks.filter((t) => !isDrumTrack(t.name));
    this.resetLoading(melodicTracks.length);

    const compressor = this.effects.find((e) => e instanceof Tone.Compressor) as Tone.Compressor;

    for (const track of project.tracks) {
      this.createTrackChannel(track);
    }

    // Route synthesized drum kit through each drum track channel
    for (const track of project.tracks) {
      if (isDrumTrack(track.name)) {
        const channel = this.trackChannels.get(track.id);
        if (channel && this.drumKit) {
          this.drumKit.output.connect(channel.gain);
          channel.gain.connect(channel.panner);
        }
      }
    }

    for (const track of melodicTracks) {
      const channel = this.trackChannels.get(track.id);
      const sidechainGain = new Tone.Gain(1).connect(compressor);
      this.sidechainGains.set(track.id, sidechainGain);

      const voiceType = voiceTypeForTrack(track.name);

      if (voiceType === 'custom') {
        const synth = createSynthForTrack(track.name, project.style);
        synth.connect(channel?.gain ?? sidechainGain);
        this.instruments.set(track.id, synth);
      } else {
        const instrumentName = instrumentForTrack(track.name);
        const soundfont = new Soundfont(context, {
          instrument: instrumentName,
          kit: 'FluidR3_GM',
          volume: 100,
        });

        await soundfont.load;

        if (channel) {
          (soundfont.output as unknown as AudioNode).connect(channel.gain as unknown as AudioNode);
        } else {
          (soundfont.output as unknown as AudioNode).connect(sidechainGain as unknown as AudioNode);
        }
        this.instruments.set(track.id, soundfont);
      }

      if (channel) {
        channel.gain.connect(channel.panner);
        channel.panner.connect(sidechainGain);
      }

      this.markLoaded();
    }

    this.applySoloState();
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

      if (isDrumTrack(track.name)) {
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
            // Tone.js synths
            instrument.triggerAttackRelease(value.note, value.duration, time, vel);
          } else {
            // smplr Soundfont
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

    // Metronome
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
