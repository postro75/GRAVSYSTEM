from typing import Literal
from music_theory import parse_chord, scale_notes

TICKS_PER_BEAT = 480
BEATS_PER_BAR = 4
BAR_TICKS = BEATS_PER_BAR * TICKS_PER_BEAT

MidiEvent = dict[str, int | float]


def _clamp_velocity(v: float) -> int:
    return max(1, min(127, round(v)))


def _mulberry32(seed: int):
    t = seed + 0x6D2B79F5
    while True:
        t = (t + 0x6D2B79F5) & 0xFFFFFFFF
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + ((t ^ (t >> 7)) * (t | 61))) & 0xFFFFFFFF
        yield (((t ^ (t >> 14)) >> 0) & 0xFFFFFFFF) / 4294967296


def generate_drum_pattern(pattern_type: str, bar_ticks: int, style: str, bar_index: int) -> list[MidiEvent]:
    events: list[MidiEvent] = []
    step_ticks = bar_ticks // 16
    rng = _mulberry32(bar_index * 12345 + len(pattern_type))

    drum = {
        "kick": 36,
        "snare": 38,
        "clap": 39,
        "hihat_closed": 42,
        "hihat_open": 46,
        "crash": 49,
    }

    is_fill = bar_index > 0 and bar_index % 4 == 3

    def add(step: int, note: int, velocity: float, duration_factor: float = 1.0) -> None:
        events.append(
            {
                "time": step * step_ticks,
                "duration": max(1, int(step_ticks * duration_factor)),
                "note": note,
                "velocity": _clamp_velocity(velocity),
            }
        )

    for step in range(16):
        is_kick_step = step % 4 == 0
        is_backbeat = step % 8 == 4
        is_offbeat = step % 4 == 2

        if pattern_type in ("four_on_floor", "techno_kick"):
            if is_kick_step:
                vel = 120 if pattern_type == "techno_kick" else 110
                add(step, drum["kick"], vel + (next(rng) * 10 if is_fill else 0), 0.6)
            if pattern_type == "four_on_floor":
                if is_offbeat:
                    add(step, drum["hihat_closed"], 70 + next(rng) * 15, 0.3)
                if is_backbeat:
                    add(step, drum["clap"], 100, 0.5)
                if is_fill and step > 10 and step % 2 == 0:
                    add(step, drum["snare"], 90 + next(rng) * 20, 0.4)
        elif pattern_type == "techno_hats":
            vel = 60 + next(rng) * 10 if step % 2 == 0 else 45 + next(rng) * 10
            add(step, drum["hihat_closed"], vel, 0.2)
            if is_offbeat:
                add(step, drum["hihat_open"], 75 + next(rng) * 10, 0.3)
        elif pattern_type == "techno_drive":
            if is_kick_step:
                add(step, drum["kick"], 120, 0.5)
            add(step, drum["hihat_closed"], 65 if step % 2 == 0 else 50, 0.2)
            if is_backbeat:
                add(step, drum["snare"], 105 + next(rng) * 10, 0.4)
        elif pattern_type == "electronic_sparse":
            if step % 8 == 0:
                add(step, drum["kick"], 90, 0.8)
            if step % 8 == 4:
                add(step, drum["snare"], 75, 0.5)
            if step % 8 == 6:
                add(step, drum["hihat_open"], 55, 0.6)
        elif pattern_type == "ambient_textures":
            if step == 0:
                add(step, drum["kick"], 50, 4.0)
            if step % 16 == 8:
                add(step, drum["hihat_open"], 35, 2.0)
        elif pattern_type == "hihat_16ths":
            if is_kick_step:
                add(step, drum["kick"], 110, 0.5)
            if is_backbeat:
                add(step, drum["snare"], 100, 0.4)
            add(step, drum["hihat_closed"], 60 + next(rng) * 10, 0.2)
        else:
            if is_kick_step:
                add(step, drum["kick"], 100, 0.5)
            if is_offbeat:
                add(step, drum["hihat_closed"], 60, 0.3)

    return events


def generate_bass_pattern(pattern_type: str, chord: dict, bar_ticks: int, style: str, bar_index: int) -> list[MidiEvent]:
    events: list[MidiEvent] = []
    step_ticks = bar_ticks // 16
    rng = _mulberry32(bar_index * 67890 + len(pattern_type))
    root = chord["root"]

    def root_midi(octave: int) -> int:
        return root + (octave + 1) * 12

    def fifth_midi(octave: int) -> int:
        return ((root + 7) % 12) + (octave + 1) * 12

    def add(step: int, note: int, velocity: float, duration_factor: float) -> None:
        events.append(
            {
                "time": step * step_ticks,
                "duration": max(1, int(step_ticks * duration_factor)),
                "note": note,
                "velocity": _clamp_velocity(velocity),
            }
        )

    if pattern_type == "root_fifth_octave":
        add(0, root_midi(2), 110, 4)
        add(4, fifth_midi(2), 100, 4)
        add(8, root_midi(3), 105, 4)
        add(12, fifth_midi(2), 100, 4)
    elif pattern_type == "analog_sequence":
        for step in range(8):
            note = root_midi(2) if step % 4 == 0 else fifth_midi(2) if step % 4 == 2 else root_midi(3)
            add(step * 2, note, 95 + next(rng) * 10, 1.5)
    elif pattern_type == "synthwave_bass":
        for step in range(8):
            if step % 2 == 0:
                add(step * 2, root_midi(2), 110, 1.8)
            elif step in (3, 7):
                add(step * 2, fifth_midi(2), 95, 1.5)
    elif pattern_type == "techno_bass":
        for step in range(16):
            if step % 8 in (0, 3, 6):
                add(step, root_midi(1), 115, 0.8)
    elif pattern_type == "edm_bass":
        add(0, root_midi(2), 115, 7.5)
        add(8, fifth_midi(2), 105, 7.5)
    else:
        add(0, root_midi(2), 100, 8)

    return events


def generate_arpeggio_pattern(pattern_type: str, chord: dict, bar_ticks: int, style: str, octave_shift: int, bar_index: int) -> list[MidiEvent]:
    events: list[MidiEvent] = []
    rng = _mulberry32(bar_index * 11111 + len(pattern_type))
    base_octave = 4 if style == "jarre" else 5
    notes = [(n % 12) + (base_octave + octave_shift + 1) * 12 for n in chord["notes"]]

    is_slow = "slow" in pattern_type
    is_fast = "16ths" in pattern_type
    steps = 16 if is_fast else 8
    step_ticks = bar_ticks // steps
    velocity = 70 if style == "jarre" else 55 if style == "ambient" else 80

    for step in range(steps):
        if style == "ambient" and step % 2 == 1:
            continue
        if pattern_type in ("arp_down", "arp_slow_down"):
            note_index = len(notes) - 1 - (step % len(notes))
        elif pattern_type == "arp_up_down":
            cycle = step % (len(notes) * 2 - 2)
            note_index = cycle if cycle < len(notes) else len(notes) * 2 - 2 - cycle
        else:
            note_index = step % len(notes)

        events.append(
            {
                "time": step * step_ticks,
                "duration": int(step_ticks * 0.75),
                "note": notes[note_index],
                "velocity": _clamp_velocity(velocity + next(rng) * 15),
            }
        )

    return events


def generate_chord_pattern(pattern_type: str, chord: dict, bar_ticks: int, style: str, bar_index: int) -> list[MidiEvent]:
    events: list[MidiEvent] = []
    rng = _mulberry32(bar_index * 22222 + len(pattern_type))
    base_octave = 4
    notes = [(n % 12) + (base_octave + 1) * 12 for n in chord["notes"]]
    velocity = 50 if style == "ambient" else 60 if style == "jarre" else 70

    if pattern_type in ("chord_stabs", "stab_chords"):
        for step in (0, 8):
            time = step * (bar_ticks // 16)
            for i, note in enumerate(notes):
                events.append(
                    {
                        "time": time + i * 3,
                        "duration": bar_ticks // 8,
                        "note": note,
                        "velocity": _clamp_velocity(velocity + 15 + next(rng) * 10),
                    }
                )
    else:
        for i, note in enumerate(notes):
            events.append(
                {
                    "time": i * 4,
                    "duration": bar_ticks - i * 8,
                    "note": note,
                    "velocity": _clamp_velocity(velocity + next(rng) * 10),
                }
            )

    return events


def generate_lead_pattern(pattern_type: str, chord: dict, scale: list[int], bar_ticks: int, style: str, bar_index: int) -> list[MidiEvent]:
    events: list[MidiEvent] = []
    rng = _mulberry32(bar_index * 33333 + len(pattern_type))
    base_octave = 5 if style == "jarre" else 6
    source_notes = chord["notes"] if len(chord["notes"]) >= 3 else scale
    shifted = [(n % 12) + (base_octave + 1) * 12 for n in source_notes]

    if pattern_type == "oxygene_lead":
        note1 = shifted[bar_index % len(shifted)]
        events.append({"time": 0, "duration": bar_ticks, "note": note1, "velocity": 70})
        if bar_index % 2 == 1:
            note2 = shifted[(bar_index + 2) % len(shifted)]
            events.append(
                {
                    "time": bar_ticks // 2,
                    "duration": bar_ticks // 2,
                    "note": note2,
                    "velocity": 65,
                }
            )
    elif pattern_type == "melody":
        phrase_length = 8
        step_ticks = bar_ticks // phrase_length
        for step in range(phrase_length):
            if step % 2 == 0 or (step == 3 and next(rng) > 0.3):
                note = shifted[(step + bar_index) % len(shifted)]
                events.append(
                    {
                        "time": step * step_ticks,
                        "duration": int(step_ticks * (1.2 if next(rng) > 0.5 else 0.8)),
                        "note": note,
                        "velocity": _clamp_velocity(80 + next(rng) * 20),
                    }
                )
    else:
        note = shifted[bar_index % len(shifted)]
        events.append({"time": 0, "duration": bar_ticks, "note": note, "velocity": 75})

    return events


def generate_drone_pattern(bar_ticks: int, chord: dict, bar_index: int) -> list[MidiEvent]:
    base = chord["root"] + (2 + 1) * 12
    return [
        {"time": 0, "duration": bar_ticks, "note": base, "velocity": 45},
        {"time": 0, "duration": bar_ticks, "note": base + 12, "velocity": 35},
    ]


def generate_fx_pattern(bar_ticks: int, bar_index: int) -> list[MidiEvent]:
    if bar_index == 0 or bar_index % 8 == 7:
        return [{"time": 0, "duration": bar_ticks, "note": 96, "velocity": 40}]
    return []


def generate_track_events(
    track_name: str, pattern: str, chord: dict, scale: list[int], style: str, bar_index: int
) -> list[MidiEvent]:
    name = track_name.lower()
    bar_ticks = BAR_TICKS

    if "drum" in name or "kick" in name or "hat" in name:
        return generate_drum_pattern(pattern, bar_ticks, style, bar_index)
    if "bass" in name:
        return generate_bass_pattern(pattern, chord, bar_ticks, style, bar_index)
    if "arpeggio" in name:
        shift = 0 if "1" in name else 1
        return generate_arpeggio_pattern(pattern, chord, bar_ticks, style, shift, bar_index)
    if "drone" in name:
        return generate_drone_pattern(bar_ticks, chord, bar_index)
    if "pad" in name or "string" in name or "chords" in name or "stab" in name:
        return generate_chord_pattern(pattern, chord, bar_ticks, style, bar_index)
    if "lead" in name:
        return generate_lead_pattern(pattern, chord, scale, bar_ticks, style, bar_index)
    if "fx" in name:
        return generate_fx_pattern(bar_ticks, bar_index)
    return generate_chord_pattern(pattern, chord, bar_ticks, style, bar_index)


def generate_midi_events(config: dict) -> dict[str, list[MidiEvent]]:
    scale = scale_notes(config["key"], config["scale"], 4)
    events_by_track: dict[str, list[MidiEvent]] = {}

    for track_name in config["trackLayout"]:
        pattern = config["patternTypes"].get(track_name, "chords")
        track_events: list[MidiEvent] = []

        for bar in range(config["bars"]):
            chord_name = config["chordProgression"][bar % len(config["chordProgression"])]
            chord = parse_chord(chord_name, 4)
            bar_start = bar * BAR_TICKS
            bar_events = generate_track_events(track_name, pattern, chord, scale, config["style"], bar)

            for evt in bar_events:
                track_events.append({**evt, "time": bar_start + int(evt["time"])})

        events_by_track[track_name] = track_events

    return events_by_track
