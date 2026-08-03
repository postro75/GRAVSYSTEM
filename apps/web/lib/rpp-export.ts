import { Project, Track } from '@gravsystem/core';

const TICKS_PER_BEAT = 960;
const BEATS_PER_BAR = 4;

function toHexByte(value: number): string {
  return Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0');
}

function midiSourceForTrack(project: Project, track: Track, channel: number): string {
  const events: { time: number; bytes: string }[] = [];

  for (const region of track.regions) {
    const regionStartTicks = Math.round(region.startBeat * TICKS_PER_BEAT);
    for (const evt of region.midiEvents) {
      const startTicks = regionStartTicks + Math.round(evt.start * TICKS_PER_BEAT);
      const durationTicks = Math.max(1, Math.round(evt.duration * TICKS_PER_BEAT));
      const noteOnStatus = toHexByte(0x90 | channel);
      const noteOffStatus = toHexByte(0x80 | channel);
      const note = toHexByte(evt.pitch);
      const vel = toHexByte(evt.velocity);
      events.push({ time: startTicks, bytes: `${noteOnStatus} ${note} ${vel}` });
      events.push({ time: startTicks + durationTicks, bytes: `${noteOffStatus} ${note} 00` });
    }
  }

  events.sort((a, b) => a.time - b.time);

  let source = '';
  source += `        HASDATA 1 ${TICKS_PER_BEAT} QN\n`;
  source += `        CCINTERP 32\n`;
  source += `        POOLEDEVTS {00000000-0000-0000-0000-000000000000}\n`;
  source += `        CCINTERP 32\n`;
  source += `        CHANZELOFFSET 0\n`;
  source += `        CCOUNT 0\n`;
  source += `        SRCFLAGS 0\n`;
  source += `        E 0 b0 7b 00\n`;

  for (const evt of events) {
    source += `        E ${evt.time} ${evt.bytes}\n`;
  }

  const totalTicks = project.bars * BEATS_PER_BAR * TICKS_PER_BEAT;
  source += `        E ${totalTicks} ff 2f 00\n`;

  return source;
}

export function generateRpp(project: Project): string {
  const totalSeconds = project.bars * BEATS_PER_BAR * (60 / project.bpm);

  let rpp = `<REAPER_PROJECT 0.1 "6.0" ${Date.now()}\n`;
  rpp += `  RIPPLE 0\n`;
  rpp += `  GROUPOVERRIDE 0 0 0\n`;
  rpp += `  AUTOXFADE 1\n`;
  rpp += `  ENVATTACH 1\n`;
  rpp += `  MIXERUIFLAGS 11 0\n`;
  rpp += `  PEAKGAIN 1 0 0\n`;
  rpp += `  FEEDBACK 0\n`;
  rpp += `  PANLAW 1\n`;
  rpp += `  PROJOFFS 0 0 0\n`;
  rpp += `  MAXPROJLEN 0 600\n`;
  rpp += `  GRID 1 8 1 8 1 0 0 0\n`;
  rpp += `  TIMEMODE 1 5 -1 30 0 0 -1\n`;
  rpp += `  VIDEO_CONFIG 0 0 256\n`;
  rpp += `  PANMODE 3\n`;
  rpp += `  CURSOR 0\n`;
  rpp += `  HORIZZOOM 100 0 0\n`;
  rpp += `  VERTZOOM 100 24 0\n`;
  rpp += `  VZOOMEX 6 0\n`;
  rpp += `  USE_REC_CFG 0\n`;
  rpp += `  RECMODE 1\n`;
  rpp += `  SMPTESYNC 0 30 100 40 1000 300 0 0 1 0 0\n`;
  rpp += `  LOOP 0\n`;
  rpp += `  LOOPGRAN 0 4\n`;
  rpp += `  RECORD_PATH "" ""\n`;
  rpp += `  RENDER_FILE ""\n`;
  rpp += `  RENDER_PATTERN ""\n`;
  rpp += `  RENDER_FMT 0 2 0\n`;
  rpp += `  RENDER_1X 0\n`;
  rpp += `  RENDER_RANGE 1 0 0 18 1000\n`;
  rpp += `  RENDER_RESAMPLE 3 0 1\n`;
  rpp += `  RENDER_ADDTOPROJ 0\n`;
  rpp += `  RENDER_BOUNDS 0 0 0 0 0 0 0\n`;
  rpp += `  RENDER_CHANNELS 2\n`;
  rpp += `  RENDER_RATE 44100\n`;
  rpp += `  RENDER_RESAMPLE_HD 0\n`;
  rpp += `  RENDER_DITHER 0\n`;
  rpp += `  TIMELOCKMODE 1\n`;
  rpp += `  TEMPOENVLOCKMODE 1\n`;
  rpp += `  ITEMMIX 0\n`;
  rpp += `  DEFPITCHMODE 589824 0\n`;
  rpp += `  TAKELANE 1\n`;
  rpp += `  SAMPLERATE 44100 0 0\n`;
  rpp += `  <RENDER_CFG\n`;
  rpp += `  >\n`;
  rpp += `  LOCK 1\n`;
  rpp += `  <METRONOME 6 2\n`;
  rpp += `    VOL 0.25 0.125\n`;
  rpp += `    FREQ 800 1600 1\n`;
  rpp += `    BEATLEN 4\n`;
  rpp += `    SAMPLES ""\n`;
  rpp += `  >\n`;
  rpp += `  GLOBAL_AUTO -1\n`;
  rpp += `  TEMPO ${project.bpm} 4 4\n`;
  rpp += `  PLAYRATE 1 0 0.25 4\n`;
  rpp += `  SELECTION 0 0\n`;
  rpp += `  SELECTION2 0 0\n`;
  rpp += `  MASTERHWOUT 0 0 1 0 0 0 0 -1\n`;
  rpp += `  MASTER_NCH 2 2\n`;
  rpp += `  MASTER_VOLUME 1 0 -1 -1 1\n`;
  rpp += `  MASTER_PANMODE 3\n`;
  rpp += `  MASTER_FX 1\n`;
  rpp += `  MASTER_SEL 0\n`;
  rpp += `  <MASTERFXLIST\n`;
  rpp += `  >\n`;
  rpp += `  <MASTERPLAYSPEEDENV\n`;
  rpp += `    ACT 0 -1\n`;
  rpp += `    VIS 0 1 1\n`;
  rpp += `    LANEHEIGHT 0 0\n`;
  rpp += `    ARM 0\n`;
  rpp += `    DEFSHAPE 0 -1 -1 -1\n`;
  rpp += `  >\n`;
  rpp += `  <TEMPOENVEX\n`;
  rpp += `    ACT 1 -1\n`;
  rpp += `    VIS 1 0 1\n`;
  rpp += `    LANEHEIGHT 0 0\n`;
  rpp += `    ARM 0\n`;
  rpp += `    DEFSHAPE 0 -1 -1 -1\n`;
  rpp += `  >\n`;
  rpp += `  <PROJMARKERS 0 2\n`;
  rpp += `  >\n`;
  rpp += `  <PROJMARKERS2 0\n`;
  rpp += `  >\n`;
  rpp += `  <EXTENSIONS\n`;
  rpp += `  >\n`;

  for (let i = 0; i < project.tracks.length; i++) {
    const track = project.tracks[i];
    const channel = Math.max(0, Math.min(15, (track.channel ?? 1) - 1));
    const trackName = track.name.toUpperCase().replace(/\s+/g, '_');
    const trackId = `${i.toString(16).padStart(8, '0')}-0000-0000-0000-000000000000`;

    rpp += `  <TRACK ${i} ${trackName}\n`;
    rpp += `    PEAKCOL 165176\n`;
    rpp += `    BEZ 0\n`;
    rpp += `    DEFSHAPE 0 -1 -1 -1\n`;
    rpp += `    VOLPAN ${track.volume ?? 1} ${track.pan ?? 0} -1 -1 1\n`;
    rpp += `    MUTESOLO ${track.mute ? 1 : 0} ${track.solo ? 1 : 0} 0\n`;
    rpp += `    IPHASE 0\n`;
    rpp += `    PLAYOFFS 0 1\n`;
    rpp += `    ISBUS 0 0\n`;
    rpp += `    BUSCOMP 0 0 0 0 0\n`;
    rpp += `    SHOWINMIX 1 0.6667 0.5 1 0.5 0 0 0\n`;
    rpp += `    SEL 0\n`;
    rpp += `    REC 0 0 1 0 0 0 0\n`;
    rpp += `    VUCC 0 0\n`;
    rpp += `    TRACKHEIGHT 0 0 0 0 0 0\n`;
    rpp += `    INQ 0 0 0 0.5 100 0 0 100\n`;
    rpp += `    NCHAN 2\n`;
    rpp += `    FX 1\n`;
    rpp += `    TRACKID {${trackId}}\n`;
    rpp += `    PERF 0\n`;
    rpp += `    MIDIOUT -1\n`;
    rpp += `    MAINSEND 1 0\n`;
    rpp += `    <FXCHAIN\n`;
    rpp += `      SHOW 0\n`;
    rpp += `      LASTSEL 0\n`;
    rpp += `      DOCKED 0\n`;
    rpp += `    >\n`;
    rpp += `    <ITEM\n`;
    rpp += `      POSITION 0\n`;
    rpp += `      SNAPOFFS 0\n`;
    rpp += `      LENGTH ${totalSeconds.toFixed(6)}\n`;
    rpp += `      LOOP 1\n`;
    rpp += `      ALLTAKES 0\n`;
    rpp += `      FADEIN 1 0.01 0 1 0 0 0\n`;
    rpp += `      FADEOUT 1 0.01 0 1 0 0 0\n`;
    rpp += `      MUTE 0 0\n`;
    rpp += `      SEL 0\n`;
    rpp += `      IGUID {${i.toString(16).padStart(8, '0')}-1111-1111-1111-111111111111}\n`;
    rpp += `      IID 1\n`;
    rpp += `      NAME ""\n`;
    rpp += `      VOLPAN 1 0 1 -1\n`;
    rpp += `      SOFFS 0\n`;
    rpp += `      PLAYRATE 1 1 0 -1 0 0.0025\n`;
    rpp += `      CHANMODE 0\n`;
    rpp += `      GUID {${i.toString(16).padStart(8, '0')}-2222-2222-2222-222222222222}\n`;
    rpp += `      <SOURCE MIDI\n`;
    rpp += midiSourceForTrack(project, track, channel);
    rpp += `      >\n`;
    rpp += `    >\n`;
    rpp += `  >\n`;
  }

  rpp += `>\n`;
  return rpp;
}

export function downloadRpp(project: Project) {
  const rpp = generateRpp(project);
  const blob = new Blob([rpp], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/\s+/g, '_')}.rpp`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
