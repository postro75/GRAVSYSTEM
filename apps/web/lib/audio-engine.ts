import * as Tone from 'tone';
import { Soundfont, DrumMachine } from 'smplr';
import { Project } from '@gravsystem/core';

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

const STYLE_INSTRUMENTS: Record<string, Partial<Record<keyof typeof GM_INSTRUMENTS, string>>> = {
  jarre: {
    bass: 'synth_bass_1',
    pad: 'pad_2_warm',
    string: 'synth_strings_1',
    drone: 'pad_4_choir',
    arpeggio: 'marimba',
    chords: 'pad_2_warm',
    stab: 'synth_brass_1',
    lead: 'lead_2_sawtooth',
    fx: 'fx_8_scifi',
  },
  synthwave: {
    bass: 'synth_bass_1',
    pad: 'synth_strings_1',
    arpeggio: 'synth_bell',
    chords: 'electric_piano_1',
    stab: 'synth_brass_1',
    lead: 'lead_8_bass_lead',
  },
  techno: {
    bass: 'synth_bass_2',
    pad: 'pad_5_bowed',
    arpeggio: 'vibraphone',
    chords: 'pad_6_metallic',
    stab: 'synth_brass_2',
    lead: 'lead_2_sawtooth',
  },
  dance: {
    bass: 'synth_bass_2',
    pad: 'string_ensemble_1',
    arpeggio: 'marimba',
    chords: 'electric_piano_1',
    stab: 'synth_brass_1',
    lead: 'lead_2_sawtooth',
  },
  electro: {
    bass: 'synth_bass_2',
    pad: 'pad_3_polysynth',
    arpeggio: 'synth_bell',
    chords: 'electric_piano_1',
    stab: 'synth_brass_1',
    lead: 'lead_2_sawtooth',
  },
  house: {
    bass: 'synth_bass_1',
    pad: 'pad_2_warm',
    arpeggio: 'vibraphone',
    chords: 'electric_piano_1',
    stab: 'synth_brass_1',
    lead: 'lead_2_sawtooth',
  },
  ambient: {
    bass: 'acoustic_bass',
    pad: 'pad_1_new_age',
    drone: 'choir_aahs',
    arpeggio: 'vibraphone',
    chords: 'pad_2_warm',
    lead: 'lead_3_calliope',
  },
};

function instrumentForTrack(trackName: string, style: string): string {
  const name = trackName.toLowerCase();
  const styleMap = STYLE_INSTRUMENTS[style] ?? {};

  for (const [key, value] of Object.entries(styleMap)) {
    if (name.includes(key) && value) return value;
  }
  for (const [key, value] of Object.entries(GM_INSTRUMENTS)) {
    if (name.includes(key)) return value;
  }
  return 'synth_strings_1';
}

function isDrumTrack(trackName: string): boolean {
  const name = trackName.toLowerCase();
  return name.includes('drum') || name.includes('kick') || name.includes('hat') || name.includes('clap');
}

export class AudioEngine {
  private project: Project | null = null;
  private onStateChange?: (state: AudioEngineState) => void;
  private isStarted = false;
  private parts: Tone.Part[] = [];
  private instruments: Map<string, Soundfont> = new Map();
  private drumMachine?: DrumMachine;
  private drumSampler?: Tone.Sampler;
  private effects: Tone.ToneAudioNode[] = [];
  private sidechainGains: Map<string, Tone.Gain> = new Map();
  private loadingCount = 0;
  private loadedCount = 0;

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

      // Sidechain source: kick-driven gain reduction
      // Drum sampler using local WAV samples
      this.drumSampler = new Tone.Sampler(
        {
          C1: '/samples/kick.wav',
          D1: '/samples/snare.wav',
          'F#1': '/samples/hihat.wav',
          A1: '/samples/clap.wav',
        },
        { attack: 0, release: 0.1, volume: -2 }
      ).connect(eq);

      this.emit({ isReady: true });
    } catch (err) {
      this.emit({ error: err instanceof Error ? err.message : 'Audio engine init failed' });
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

  private async loadInstruments(project: Project) {
    const context = Tone.context.rawContext as AudioContext;

    // Dispose old instruments
    for (const inst of this.instruments.values()) {
      inst.output.disconnect();
    }
    this.instruments.clear();
    for (const gain of this.sidechainGains.values()) {
      gain.dispose();
    }
    this.sidechainGains.clear();

    const melodicTracks = project.tracks.filter((t) => !isDrumTrack(t.name));
    this.resetLoading(melodicTracks.length);

    const compressor = this.effects[3];

    for (const track of melodicTracks) {
      const instrumentName = instrumentForTrack(track.name, project.style);
      const soundfont = new Soundfont(context, {
        instrument: instrumentName,
        kit: 'FluidR3_GM',
        volume: 100,
      });

      await soundfont.load;

      // Sidechain gain per track (ducked by kick)
      const sidechainGain = new Tone.Gain(1).connect(compressor);
      (soundfont.output as unknown as AudioNode).connect(sidechainGain as unknown as AudioNode);
      this.sidechainGains.set(track.id, sidechainGain);

      this.instruments.set(track.id, soundfont);
      this.markLoaded();
    }
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

      if (notes.length === 0) continue;

      if (isDrumTrack(track.name)) {
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
          const sample = drumSampleName(value.note);
          this.drumSampler?.triggerAttackRelease(sample, value.duration, time, value.velocity);
        }, notes);
        part.start(0);
        this.parts.push(part);
      } else {
        const instrument = this.instruments.get(track.id);
        if (!instrument) continue;

        const part = new Tone.Part<ScheduledNote>((time, value) => {
          instrument.start({
            note: value.note,
            time,
            duration: value.duration,
            velocity: Math.round(value.velocity * 127),
          });
        }, notes);
        part.start(0);
        this.parts.push(part);
      }
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
    this.effects.forEach((eff) => eff.dispose());
    this.instruments.forEach((inst) => inst.output.disconnect());
    this.instruments.clear();
    this.sidechainGains.forEach((gain) => gain.dispose());
    this.sidechainGains.clear();
    this.drumSampler?.dispose();
    Tone.Transport.cancel(0);
  }
}

function drumSampleName(pitch: number): string {
  switch (pitch) {
    case 36:
      return 'C1';
    case 38:
      return 'D1';
    case 39:
      return 'A1';
    case 42:
      return 'F#1';
    default:
      return 'C1';
  }
}
