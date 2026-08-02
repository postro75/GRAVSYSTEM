import re
from typing import Literal

KEY_INDEX: dict[str, int] = {
    "C": 0,
    "C#": 1,
    "Db": 1,
    "D": 2,
    "D#": 3,
    "Eb": 3,
    "E": 4,
    "F": 5,
    "F#": 6,
    "Gb": 6,
    "G": 7,
    "G#": 8,
    "Ab": 8,
    "A": 9,
    "A#": 10,
    "Bb": 10,
    "B": 11,
}

SCALE_INTERVALS: dict[str, list[int]] = {
    "major": [0, 2, 4, 5, 7, 9, 11],
    "minor": [0, 2, 3, 5, 7, 8, 10],
}

CHORD_INTERVALS: dict[str, list[int]] = {
    "": [0, 4, 7],
    "m": [0, 3, 7],
    "min": [0, 3, 7],
    "maj7": [0, 4, 7, 11],
    "7": [0, 4, 7, 10],
    "m7": [0, 3, 7, 10],
    "sus4": [0, 5, 7],
    "dim": [0, 3, 6],
    "aug": [0, 4, 8],
}

CHORD_PATTERN = re.compile(r"([A-G][#b]?)(m(?:in)?|maj7?|7|sus4|dim|aug)?")


def note_to_midi(note: str) -> int:
    parsed = CHORD_PATTERN.match(note)
    if not parsed:
        return 60
    key = parsed.group(1)
    return (KEY_INDEX.get(key, 0) + 60) % 128


def parse_chord(chord_name: str, octave: int = 4) -> dict[str, object]:
    parsed = CHORD_PATTERN.match(chord_name)
    if not parsed:
        return {"root": 0, "notes": [60, 64, 67]}
    key, suffix = parsed.groups()
    root = KEY_INDEX.get(key, 0)
    intervals = CHORD_INTERVALS.get(suffix or "", CHORD_INTERVALS[""])
    base_midi = (octave + 1) * 12 + root
    notes = [base_midi + interval for interval in intervals]
    return {"root": root, "notes": notes}


def scale_notes(key: str, scale: str, octave: int = 4) -> list[int]:
    root = KEY_INDEX.get(key, 0)
    intervals = SCALE_INTERVALS.get(scale, SCALE_INTERVALS["minor"])
    base_midi = (octave + 1) * 12 + root
    return [base_midi + interval for interval in intervals]


STYLE_PROGRESSIONS: dict[str, dict[str, list[str]]] = {
    "jarre": {
        "minor": ["Dm", "C", "Bb", "A"],
        "major": ["C", "G/B", "Am", "F"],
    },
    "ambient": {
        "minor": ["Am", "G", "F", "G"],
        "major": ["C", "G/B", "Am", "F"],
    },
    "synthwave": {
        "minor": ["Am", "F", "Dm", "G"],
        "major": ["F", "G", "Em", "Am"],
    },
    "dance": {
        "minor": ["Dm", "Bb", "F", "C"],
        "major": ["C", "G", "Am", "F"],
    },
    "electro": {
        "minor": ["Dm", "A", "Gm", "Bb"],
        "major": ["C", "Am", "F", "G"],
    },
    "house": {
        "minor": ["Am", "F", "C", "G"],
        "major": ["C", "G", "Am", "F"],
    },
    "techno": {
        "minor": ["Dm", "Gm", "A", "Dm"],
        "major": ["Cm", "Gm", "Ab", "Bb"],
    },
}


def default_progression(scale: str, style: str = "dance") -> list[str]:
    style_map = STYLE_PROGRESSIONS.get(style, STYLE_PROGRESSIONS["dance"])
    return style_map.get(scale, style_map["minor"])


SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]


def transpose_progression(
    progression: list[str], target_key: str, scale: Literal["major", "minor"] = "minor"
) -> list[str]:
    source_root = parse_chord(progression[0])["root"]
    target_root = KEY_INDEX.get(target_key, 0)
    offset = target_root - source_root

    has_flat = "b" in target_key
    has_sharp = "#" in target_key
    use_flats = has_flat or (scale == "minor" and not has_sharp)
    names = FLAT_NAMES if use_flats else SHARP_NAMES

    result: list[str] = []
    for chord in progression:
        parsed = CHORD_PATTERN.match(chord)
        if not parsed:
            result.append(chord)
            continue
        key, suffix = parsed.groups()
        key_index = KEY_INDEX.get(key, 0)
        new_index = (key_index + offset) % 12
        result.append(names[new_index] + (suffix or ""))
    return result


def default_track_layout(style: str) -> list[str]:
    layouts: dict[str, list[str]] = {
        "jarre": ["Drums", "Bass Seq", "Arpeggio 1", "Arpeggio 2", "Pad", "String Pad", "Lead", "FX"],
        "ambient": ["Drone", "Pad", "Arpeggio", "Bass", "Lead", "FX"],
        "techno": ["Kick", "Hats", "Bass", "Stab", "Arpeggio", "Pad"],
        "synthwave": ["Drums", "Bass", "Arpeggio", "Pad", "Lead"],
        "dance": ["Drums", "Bass", "Chords", "Lead", "FX"],
        "electro": ["Drums", "Bass", "Chords", "Lead", "FX"],
        "house": ["Drums", "Bass", "Chords", "Lead", "FX"],
    }
    return layouts.get(style, ["Drums", "Bass", "Arpeggio", "Pad", "Lead"])


def default_pattern_type(track_name: str, style: str) -> str:
    name = track_name.lower()
    if "drum" in name:
        if style == "jarre":
            return "electronic_sparse"
        if style == "ambient":
            return "ambient_textures"
        if style == "techno":
            return "techno_drive"
        return "four_on_floor"
    if "kick" in name:
        return "techno_kick" if style == "techno" else "four_on_floor"
    if "hat" in name:
        return "techno_hats" if style == "techno" else "hihat_16ths"
    if "bass" in name:
        if style == "jarre":
            return "analog_sequence"
        if style == "synthwave":
            return "synthwave_bass"
        if style == "techno":
            return "techno_bass"
        if style in ("dance", "electro"):
            return "edm_bass"
        return "root_fifth_octave"
    if "arpeggio" in name:
        if "1" in name:
            return "arp_slow_up" if style == "jarre" else "arp_16ths"
        return "arp_slow_down" if style == "jarre" else "arp_up"
    if "chords" in name or "stab" in name:
        if style in ("dance", "electro"):
            return "chord_stabs"
        if style == "techno":
            return "stab_chords"
        return "chords"
    if "string" in name:
        return "string_pad"
    if "pad" in name or "drone" in name:
        return "ambient_pad" if style == "jarre" else "chords"
    if "lead" in name:
        return "oxygene_lead" if style == "jarre" else "melody"
    if "fx" in name:
        return "fx_markers"
    return "chords"


def default_pattern_types(layout: list[str], style: str) -> dict[str, str]:
    return {track: default_pattern_type(track, style) for track in layout}


def style_bpm(style: str) -> int:
    bpms: dict[str, int] = {
        "jarre": 108,
        "ambient": 90,
        "synthwave": 110,
        "techno": 130,
        "house": 125,
        "electro": 128,
    }
    return bpms.get(style, 128)


def style_bars(style: str) -> int:
    return 32 if style in ("jarre", "ambient") else 16


def detect_bpm(description: str) -> int | None:
    match = re.search(r"(\d+)\s*bpm", description, re.IGNORECASE)
    if match:
        return max(60, min(200, int(match.group(1))))
    return None


def detect_bars(description: str) -> int | None:
    match = re.search(r"(\d+)\s*(taktów|takty|bars?|measures?)", description, re.IGNORECASE)
    if match:
        return max(8, min(64, int(match.group(1))))
    return None


def detect_key_scale(description: str) -> dict[str, str] | None:
    patterns = [
        r"tonacja\s+([A-G][#b]?)\s*(dur|moll|mol)?",
        r"\bw\s+([A-G][#b]?)\s*(dur|moll|mol)?",
        r"key\s+of\s+([A-G][#b]?)\s*(major|minor)?",
        r"\bin\s+([A-G][#b]?)\s*(major|minor)?",
        r"\b([A-G][#b]?)\s+(major|minor)\b",
        r"\b([A-G][#b]?)\s+(dur|moll|mol)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, description, re.IGNORECASE)
        if match:
            key = match.group(1).upper()
            raw_scale = (match.group(2) or "minor").lower()
            scale = "major" if raw_scale in ("major", "dur") else "minor"
            return {"key": key, "scale": scale}
    return None


def detect_style(description: str) -> str:
    lowered = description.lower()
    keywords: dict[str, str] = {
        "jarre": "jarre",
        "jean-michel": "jarre",
        "oxygene": "jarre",
        "kavinsky": "synthwave",
        "synthwave": "synthwave",
        "guetta": "dance",
        "edm": "dance",
        "house": "house",
        "electro": "electro",
        "dance": "dance",
        "techno": "techno",
        "trance": "techno",
        "ambient": "ambient",
    }
    for keyword, style in keywords.items():
        if keyword in lowered:
            return style
    return "dance"


def extract_chords(description: str) -> list[str] | None:
    chord_re = r"(?<![A-Za-z])[A-G][#b]?(?:m(?:in)?|maj7?|7|sus4|dim|aug)?(?![A-Za-z])"
    cluster_match = re.search(
        rf"(?:akordy|chords?|progresja|progression)\s*[:-]?\s*((?:{chord_re}[,\s]+){{2,}}{chord_re})",
        description,
        re.IGNORECASE,
    )
    if cluster_match:
        return re.findall(chord_re, cluster_match.group(1))
    matches = re.findall(chord_re, description)
    return matches if len(matches) >= 3 else None


def build_config(
    description: str,
    overrides: dict[str, object] | None = None,
) -> dict[str, object]:
    overrides = overrides or {}
    style = overrides.get("style", detect_style(description))
    bpm = overrides.get("bpm", detect_bpm(description)) or style_bpm(str(style))
    bars = overrides.get("bars", detect_bars(description)) or style_bars(str(style))
    detected = detect_key_scale(description)
    key = overrides.get("key", detected.get("key") if detected else None) or ("A" if style == "synthwave" else "D")
    scale = overrides.get("scale", detected.get("scale") if detected else None) or "minor"
    explicit_chords = extract_chords(description)
    progression = (
        transpose_progression(explicit_chords, str(key), scale)
        if explicit_chords
        else transpose_progression(default_progression(str(scale), str(style)), str(key), scale)
    )
    layout = default_track_layout(str(style))
    pattern_types = default_pattern_types(layout, str(style))

    return {
        "bpm": bpm,
        "bars": bars,
        "key": key,
        "scale": scale,
        "style": style,
        "chordProgression": progression,
        "trackLayout": layout,
        "patternTypes": pattern_types,
        "description": description,
    }
