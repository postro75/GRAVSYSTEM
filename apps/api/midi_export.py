from io import BytesIO
from typing import Any
import mido
from schemas import Project, MidiEvent


def project_to_midi_bytes(project: Project) -> bytes:
    """Convert a GRAVSYSTEM Project into a Standard MIDI File (.mid)."""
    mid = mido.MidiFile(ticks_per_beat=480)
    bpm = project.bpm
    microseconds_per_beat = int(60_000_000 / bpm)

    for idx, track in enumerate(project.tracks):
        mid_track = mido.MidiTrack()
        mid.tracks.append(mid_track)

        # Track name meta event
        mid_track.append(mido.MetaMessage("track_name", name=track.name, time=0))

        # Set tempo at the start of the first track
        if idx == 0:
            mid_track.append(mido.MetaMessage("set_tempo", tempo=microseconds_per_beat, time=0))

        # Collect all events for this track with absolute tick times
        absolute_events: list[dict[str, Any]] = []
        for region in track.regions:
            start_beat = region.start_beat
            for evt in region.midi_events:
                start_tick = int((start_beat + evt.start) * 480)
                duration_ticks = max(1, int(evt.duration * 480))
                absolute_events.append(
                    {
                        "tick": start_tick,
                        "type": "on",
                        "pitch": evt.pitch,
                        "velocity": max(1, min(127, evt.velocity)),
                        "channel": max(0, min(15, track.channel - 1)),
                    }
                )
                absolute_events.append(
                    {
                        "tick": start_tick + duration_ticks,
                        "type": "off",
                        "pitch": evt.pitch,
                        "velocity": 0,
                        "channel": max(0, min(15, track.channel - 1)),
                    }
                )

        # Sort by tick, then note-off before note-on at the same tick
        absolute_events.sort(key=lambda e: (e["tick"], 0 if e["type"] == "off" else 1))

        previous_tick = 0
        for evt in absolute_events:
            delta = evt["tick"] - previous_tick
            previous_tick = evt["tick"]
            if evt["type"] == "on":
                mid_track.append(
                    mido.Message(
                        "note_on",
                        note=evt["pitch"],
                        velocity=evt["velocity"],
                        channel=evt["channel"],
                        time=delta,
                    )
                )
            else:
                mid_track.append(
                    mido.Message(
                        "note_off",
                        note=evt["pitch"],
                        velocity=0,
                        channel=evt["channel"],
                        time=delta,
                    )
                )

        # End of track
        mid_track.append(mido.MetaMessage("end_of_track", time=0))

    buffer = BytesIO()
    mid.save(file=buffer)
    return buffer.getvalue()
