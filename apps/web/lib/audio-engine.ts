import * as Tone from 'tone';
import { Soundfont } from 'smplr';
import {
  Project,
  Track,
  MidiEvent,
  AutomationParam,
  AutomationPoint,
  AUTOMATION_RANGES,
  InsertEffects,
  DEFAULT_INSERT_EFFECTS,
} from '@gravsystem/core';
import { SynthDrumKit, SampleDrumKit } from './drum-kit';
import {
  createCustomSynth,
  getInstrumentById,
  inferInstrumentForTrack,
  type InstrumentDefinition,
} from './instruments';
import {
  applyInstrumentParams,
  createSendGain,
  createTrackFilter,
  clampInstrumentParams,
  type InstrumentParams,
} from './instrument-params';
import { loadSynth101, WamInstrument } from './wam-host';

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
  | Soundfont
  | WamInstrument;

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
  filter: Tone.Filter;
  distortion: Tone.Distortion;
  chorus: Tone.Chorus;
  eq: Tone.EQ3;
  compressor: Tone.Compressor;
  sendReverb: Tone.Gain;
  sendDelay: Tone.Gain;
  meter: Tone.Meter;
  sidechain: Tone.Gain;
  mute: boolean;
  solo: boolean;
}

export function mapInsertEffects(effects: InsertEffects) {
  return {
    distortion: effects.distortion * 0.8,
    chorusWet: effects.chorus * 0.6,
    eqLow: (effects.eq - 0.5) * 12, // -6 dB .. +6 dB
    eqMid: (effects.eq - 0.5) * 12,
    eqHigh: (effects.eq - 0.5) * 12,
    compressorThreshold: effects.compressor * 30 - 30, // -30 dB .. 0 dB
    compressorRatio: 1 + effects.compressor * 11, // 1:1 .. 12:1
  };
}

interface SidechainCurve {
  floor: number;
  attack: number;
  release: number;
}

export function sidechainCurve(style: string): SidechainCurve {
  const s = style.toLowerCase();
  if (s === 'techno') return { floor: 0.35, attack: 0.015, release: 0.18 };
  if (s === 'house') return { floor: 0.45, attack: 0.02, release: 0.28 };
  if (s === 'synthwave') return { floor: 0.4, attack: 0.02, release: 0.35 };
  if (s === 'ambient' || s === 'jarre') return { floor: 0.85, attack: 0.05, release: 0.5 };
  // dance / electro default
  return { floor: 0.4, attack: 0.02, release: 0.25 };
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
  private masterReverb?: Tone.Reverb;
  private masterDelay?: Tone.FeedbackDelay;
  private masterCompressor?: Tone.Compressor;
  private automationEventIds: number[] = [];

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
      this.masterCompressor = new Tone.Compressor(-20, 3.5).connect(limiter);
      const eq = new Tone.EQ3({
        low: -2,
        mid: 1.5,
        high: -1,
        lowFrequency: 250,
        highFrequency: 4000,
      }).connect(this.masterCompressor);
      this.masterReverb = new Tone.Reverb({ decay: 2.5, preDelay: 0.02, wet: 0.25 }).connect(eq);
      this.masterDelay = new Tone.FeedbackDelay('8n.', 0.28).connect(this.masterReverb);
      const chorus = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0.35 }).connect(this.masterDelay);
      this.effects = [chorus, this.masterDelay, this.masterReverb, eq, this.masterCompressor, limiter];

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
      this.configureMasterChain(project.style);
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

  /** Reconfigure the master FX chain to match the musical style. */
  private configureMasterChain(style: string) {
    const s = style.toLowerCase();
    const ambientLike = s === 'jarre' || s === 'ambient';
    const edmLike = s === 'dance' || s === 'electro' || s === 'house';

    if (this.masterReverb) {
      this.masterReverb.decay = ambientLike ? 3.8 : edmLike ? 1.6 : 2.2;
      this.masterReverb.preDelay = ambientLike ? 0.04 : 0.02;
      this.masterReverb.wet.value = ambientLike ? 0.38 : edmLike ? 0.18 : 0.25;
    }
    if (this.masterDelay) {
      this.masterDelay.delayTime.value = ambientLike ? '8n.' : '8n';
      this.masterDelay.feedback.value = ambientLike ? 0.38 : edmLike ? 0.22 : 0.28;
      this.masterDelay.wet.value = ambientLike ? 0.35 : edmLike ? 0.12 : 0.2;
    }
    if (this.masterCompressor) {
      this.masterCompressor.threshold.value = edmLike ? -22 : -18;
      this.masterCompressor.ratio.value = edmLike ? 5 : 3;
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
      filter: createTrackFilter(track.instrumentParams),
      distortion: new Tone.Distortion(0),
      chorus: new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0 }),
      eq: new Tone.EQ3({ low: 0, mid: 0, high: 0, lowFrequency: 250, highFrequency: 4000 }),
      compressor: new Tone.Compressor({ threshold: 0, ratio: 1, attack: 0.003, release: 0.1 }),
      sendReverb: createSendGain(),
      sendDelay: createSendGain(),
      meter: new Tone.Meter({ smoothing: 0.1, normalRange: true }),
      sidechain: new Tone.Gain(1),
      mute: track.mute ?? false,
      solo: track.solo ?? false,
    };

    // Per-track FX send levels
    channel.sendReverb.gain.value = track.instrumentParams.reverb;
    channel.sendDelay.gain.value = track.instrumentParams.delay;

    // Main chain: gain -> panner -> meter -> filter -> distortion -> chorus -> eq -> compressor -> sidechain -> master
    channel.gain.connect(channel.panner);
    channel.panner.connect(channel.meter);
    channel.meter.connect(channel.filter);
    channel.filter.connect(channel.distortion);
    channel.distortion.connect(channel.chorus);
    channel.chorus.connect(channel.eq);
    channel.eq.connect(channel.compressor);
    channel.compressor.connect(channel.sidechain);
    if (this.masterCompressor) channel.sidechain.connect(this.masterCompressor);

    // FX sends tap post-panner
    channel.panner.connect(channel.sendReverb);
    channel.panner.connect(channel.sendDelay);
    if (this.masterReverb) channel.sendReverb.connect(this.masterReverb);
    if (this.masterDelay) channel.sendDelay.connect(this.masterDelay);

    this.applyInsertEffects(channel, track.insertEffects ?? DEFAULT_INSERT_EFFECTS);

    this.trackChannels.set(track.id, channel);
    this.sidechainGains.set(track.id, channel.sidechain);
    return channel;
  }

  /** Map normalized insert-effect amounts (0–1) to concrete processor parameters. */
  private applyInsertEffects(channel: TrackChannel, effects: InsertEffects) {
    const targets = mapInsertEffects(effects);
    channel.distortion.distortion = targets.distortion;
    channel.chorus.wet.value = targets.chorusWet;
    channel.eq.low.value = targets.eqLow;
    channel.eq.mid.value = targets.eqMid;
    channel.eq.high.value = targets.eqHigh;
    channel.compressor.threshold.value = targets.compressorThreshold;
    channel.compressor.ratio.value = targets.compressorRatio;
  }

  /** Swap insert-effect values for a track live. */
  updateInsertEffects(trackId: string, effects: InsertEffects) {
    const track = this.project?.tracks.find((t) => t.id === trackId);
    const channel = this.trackChannels.get(trackId);
    if (!track || !channel) return;
    track.insertEffects = effects;
    this.applyInsertEffects(channel, effects);
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

  private async loadInstrumentForTrack(track: Track, channel: TrackChannel): Promise<PlayableInstrument | null> {
    const def = this.resolveInstrumentDefinition(track);

    if (def.type === 'drums') {
      // Drum kit is created once per project load above.
      return null;
    }

    if (def.type === 'custom') {
      const synth = createCustomSynth(def.id);
      applyInstrumentParams(synth, track.instrumentParams);
      synth.connect(channel.gain);
      return synth;
    }

    if (def.type === 'wam') {
      const context = Tone.context.rawContext as AudioContext;
      const wam = await loadSynth101(context);
      (wam.output as unknown as AudioNode).connect(channel.gain as unknown as AudioNode);
      return wam;
    }

    // Soundfont: macros apply to the track-level filter/sends, not the Soundfont itself.
    const context = Tone.context.rawContext as AudioContext;
    const soundfont = new Soundfont(context, {
      instrument: def.config,
      kit: 'FluidR3_GM',
      volume: 100,
    });
    await soundfont.load;
    (soundfont.output as unknown as AudioNode).connect(channel.gain as unknown as AudioNode);
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
      channel.filter.dispose();
      channel.distortion.dispose();
      channel.chorus.dispose();
      channel.eq.dispose();
      channel.compressor.dispose();
      channel.sendReverb.dispose();
      channel.sendDelay.dispose();
      channel.meter.dispose();
      channel.sidechain.dispose();
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

    for (const track of project.tracks) {
      const channel = this.trackChannels.get(track.id)!;
      const inst = await this.loadInstrumentForTrack(track, channel);
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

    if ('scheduleNote' in instrument && typeof instrument.scheduleNote === 'function') {
      instrument.scheduleNote(pitch, Tone.now(), dur, Math.round(vel * 127));
    } else if ('triggerAttackRelease' in instrument && typeof instrument.triggerAttackRelease === 'function') {
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
          const duckCurve = sidechainCurve(this.project?.style ?? 'dance');
          const kickPart = new Tone.Part<ScheduledNote>((time) => {
            for (const [trackId, gain] of this.sidechainGains) {
              const track = this.project?.tracks.find((t) => t.id === trackId);
              if (!track?.sidechain) continue;
              gain.gain.cancelScheduledValues(time);
              gain.gain.setValueAtTime(1, time);
              gain.gain.exponentialRampToValueAtTime(duckCurve.floor, time + duckCurve.attack);
              gain.gain.exponentialRampToValueAtTime(1, time + duckCurve.release);
            }
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
          if ('scheduleNote' in instrument && typeof instrument.scheduleNote === 'function') {
            instrument.scheduleNote(value.note, time, value.duration, Math.round(vel * 127));
          } else if ('triggerAttackRelease' in instrument && typeof instrument.triggerAttackRelease === 'function') {
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
    this.scheduleAutomation(project);
  }

  private getAutomationAudioParam(
    trackId: string,
    param: AutomationParam
  ): { setValueAtTime: (value: number, time: number) => void; linearRampToValueAtTime: (value: number, endTime: number) => void; cancelScheduledValues: (time: number) => void } | undefined {
    const channel = this.trackChannels.get(trackId);
    if (!channel) return undefined;
    switch (param) {
      case 'volume':
        return channel.gain.gain as unknown as { setValueAtTime: (value: number, time: number) => void; linearRampToValueAtTime: (value: number, endTime: number) => void; cancelScheduledValues: (time: number) => void };
      case 'pan':
        return channel.panner.pan as unknown as { setValueAtTime: (value: number, time: number) => void; linearRampToValueAtTime: (value: number, endTime: number) => void; cancelScheduledValues: (time: number) => void };
      case 'cutoff':
        return channel.filter.frequency as unknown as { setValueAtTime: (value: number, time: number) => void; linearRampToValueAtTime: (value: number, endTime: number) => void; cancelScheduledValues: (time: number) => void };
      case 'resonance':
        return channel.filter.Q as unknown as { setValueAtTime: (value: number, time: number) => void; linearRampToValueAtTime: (value: number, endTime: number) => void; cancelScheduledValues: (time: number) => void };
      case 'reverb':
        return channel.sendReverb.gain as unknown as { setValueAtTime: (value: number, time: number) => void; linearRampToValueAtTime: (value: number, endTime: number) => void; cancelScheduledValues: (time: number) => void };
      case 'delay':
        return channel.sendDelay.gain as unknown as { setValueAtTime: (value: number, time: number) => void; linearRampToValueAtTime: (value: number, endTime: number) => void; cancelScheduledValues: (time: number) => void };
      default:
        return undefined;
    }
  }

  private scheduleAutomation(project: Project) {
    // Clear previous automation events
    this.automationEventIds.forEach((id) => Tone.Transport.clear(id));
    this.automationEventIds = [];

    const secondsPerBeat = 60 / project.bpm;
    const macroParams: Set<AutomationParam> = new Set(['attack', 'decay', 'sustain', 'release']);

    for (const track of project.tracks) {
      if (track.automation.length === 0) continue;

      const byParam = new Map<AutomationParam, AutomationPoint[]>();
      for (const point of track.automation) {
        const list = byParam.get(point.param) ?? [];
        list.push(point);
        byParam.set(point.param, list);
      }

      for (const [param, points] of byParam) {
        const sorted = points.sort((a, b) => a.time - b.time);

        if (macroParams.has(param)) {
          // Macro targets (ADSR) are not audio params; update the instrument live.
          if (sorted[0].time > 0) {
            const id = Tone.Transport.schedule(() => {
              this.updateInstrumentParams(track.id, { [param]: AUTOMATION_RANGES[param].default } as Partial<InstrumentParams>);
            }, 0);
            this.automationEventIds.push(id);
          }

          for (const point of sorted) {
            const startTime = point.time * secondsPerBeat;
            const id = Tone.Transport.schedule(() => {
              this.updateInstrumentParams(track.id, { [param]: point.value } as Partial<InstrumentParams>);
            }, startTime);
            this.automationEventIds.push(id);
          }
          continue;
        }

        const audioParam = this.getAutomationAudioParam(track.id, param);
        if (!audioParam) continue;

        // If first point is after beat 0, seed the static value so automation starts from the right place.
        if (sorted[0].time > 0) {
          const id = Tone.Transport.schedule((time) => {
            audioParam.setValueAtTime(AUTOMATION_RANGES[param].default, time);
          }, 0);
          this.automationEventIds.push(id);
        }

        for (let i = 0; i < sorted.length; i++) {
          const point = sorted[i];
          const next = sorted[i + 1];
          const startTime = point.time * secondsPerBeat;

          const id = Tone.Transport.schedule((time) => {
            audioParam.cancelScheduledValues(time);
            audioParam.setValueAtTime(point.value, time);
            if (next) {
              const endTime = next.time * secondsPerBeat;
              audioParam.linearRampToValueAtTime(next.value, time + (endTime - startTime));
            }
          }, startTime);
          this.automationEventIds.push(id);
        }
      }
    }
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

  /** Update a track's live instrument macro parameters (ADSR, filter, FX sends). */
  updateInstrumentParams(trackId: string, params: Partial<InstrumentParams>) {
    const track = this.project?.tracks.find((t) => t.id === trackId);
    const channel = this.trackChannels.get(trackId);
    if (!track || !channel) return;

    const next = clampInstrumentParams({ ...track.instrumentParams, ...params });
    track.instrumentParams = next;

    channel.filter.frequency.setTargetAtTime(next.cutoff, Tone.now(), 0.02);
    channel.filter.Q.setTargetAtTime(next.resonance, Tone.now(), 0.02);
    channel.sendReverb.gain.setTargetAtTime(next.reverb, Tone.now(), 0.02);
    channel.sendDelay.gain.setTargetAtTime(next.delay, Tone.now(), 0.02);

    const instrument = this.instruments.get(trackId);
    if (instrument) {
      applyInstrumentParams(instrument, next);
    }
  }

  /** Replace a track's automation data and re-schedule the ramps. */
  updateAutomation(trackId: string, points: AutomationPoint[]) {
    const track = this.project?.tracks.find((t) => t.id === trackId);
    if (!track || !this.project) return;
    track.automation = points;
    this.scheduleAutomation(this.project);
  }

  /** Toggle whether a track participates in kick-driven side-chain ducking. */
  updateSidechain(trackId: string, sidechain: boolean) {
    const track = this.project?.tracks.find((t) => t.id === trackId);
    if (!track) return;
    track.sidechain = sidechain;
  }

  /** Get per-track linear level readings (0–1) for the UI meters. */
  getMeterValues(): Record<string, number> {
    const values: Record<string, number> = {};
    for (const [id, channel] of this.trackChannels) {
      try {
        const value = channel.meter.getValue();
        values[id] = typeof value === 'number' ? Math.max(0, Math.min(1, value)) : 0;
      } catch {
        values[id] = 0;
      }
    }
    return values;
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
      channel.filter.dispose();
      channel.distortion.dispose();
      channel.chorus.dispose();
      channel.eq.dispose();
      channel.compressor.dispose();
      channel.sendReverb.dispose();
      channel.sendDelay.dispose();
      channel.meter.dispose();
      channel.sidechain.dispose();
    });
    this.trackChannels.clear();
    this.drumKit?.dispose();
    Tone.Transport.cancel(0);
  }
}
