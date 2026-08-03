from typing import Any
from datetime import datetime, timezone
from uuid import uuid4
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path

# Add packages/core/py to path so we can import shared schemas
sys.path.append(str(Path(__file__).parent.parent.parent / "packages" / "core" / "py"))

from schemas import Project, GenerationRequest, Track, Region, MidiEvent
from music_theory import build_config
from pattern_generator import generate_midi_events, TICKS_PER_BEAT
from midi_export import project_to_midi_bytes

app = FastAPI(
    title="GRAVSYSTEM API",
    description="AI DAW backend for text-to-DAW generation and rendering.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ticks_to_beats(ticks: int) -> float:
    return ticks / TICKS_PER_BEAT


def build_project_from_config(config: dict[str, Any]) -> Project:
    midi_events = generate_midi_events(config)
    tracks: list[Track] = []

    for idx, (track_name, events) in enumerate(midi_events.items()):
        regions: list[Region] = []
        if events:
            start_tick = min(int(e["time"]) for e in events)
            end_tick = max(int(e["time"]) + int(e["duration"]) for e in events)
            duration_beats = ticks_to_beats(end_tick - start_tick)
            region_midi: list[MidiEvent] = []
            for e in events:
                region_midi.append(
                    MidiEvent(
                        pitch=int(e["note"]),
                        velocity=int(e["velocity"]),
                        start=ticks_to_beats(int(e["time"])),
                        duration=ticks_to_beats(int(e["duration"])),
                    )
                )
            regions.append(
                Region(
                    id=uuid4(),
                    track_id=uuid4(),
                    name=f"{track_name} Clip",
                    start_beat=0.0,
                    duration=duration_beats,
                    type="midi",
                    midi_events=region_midi,
                )
            )

        tracks.append(
            Track(
                id=uuid4(),
                name=track_name,
                type="midi",
                instrument=_instrument_for_track(track_name),
                channel=idx + 1,
                regions=regions,
            )
        )

    return Project(
        id=uuid4(),
        title=config["description"][:60] or "Generated Project",
        description=config["description"],
        style=str(config["style"]),
        bpm=float(config["bpm"]),
        key=config["key"],
        scale=config["scale"],
        bars=int(config["bars"]),
        tracks=tracks,
    )


def _instrument_for_track(track_name: str) -> str:
    name = track_name.lower()
    if "drum" in name or "kick" in name or "hat" in name:
        return "drums"
    if "bass" in name:
        return "bass"
    if "arpeggio" in name:
        return "arpeggio"
    if "pad" in name or "string" in name:
        return "pad"
    if "chords" in name or "stab" in name:
        return "chords"
    if "lead" in name:
        return "lead"
    if "drone" in name:
        return "drone"
    return "synth"


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "gravsystem-api", "version": "1.0.0"}


@app.get("/api/schema/project")
def get_project_schema() -> dict[str, Any]:
    return Project.model_json_schema()


@app.post("/api/generate")
def generate_project(request: GenerationRequest) -> dict[str, Any]:
    """Generate a full Project JSON with MIDI events from a text description."""
    config = build_config(
        request.description,
        {
            "style": request.style,
            "bpm": request.bpm,
            "key": request.key,
            "scale": request.scale,
            "bars": request.bars,
        },
    )
    project = build_project_from_config(config)
    return {
        "success": True,
        "config": config,
        "project": project.model_dump(mode="json"),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/api/export/midi")
def export_midi(project: Project) -> Response:
    """Export a Project JSON to a downloadable .mid file."""
    midi_bytes = project_to_midi_bytes(project)
    filename = f"{project.title.replace(' ', '_')}.mid"
    return Response(
        content=midi_bytes,
        media_type="audio/midi",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "GRAVSYSTEM API is running"}
