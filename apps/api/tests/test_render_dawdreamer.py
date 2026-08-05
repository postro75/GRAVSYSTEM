import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent / "packages" / "core" / "py"))

from uuid import uuid4

from schemas import Project, Track, Region, MidiEvent
from render_dawdreamer import render_project


def _minimal_project() -> Project:
    region = Region(
        id=uuid4(),
        track_id=uuid4(),
        name="Test Clip",
        start_beat=0.0,
        duration=4.0,
        type="midi",
        midi_events=[MidiEvent(pitch=60, velocity=100, start=0.0, duration=1.0)],
    )
    track = Track(
        id=uuid4(),
        name="Test Lead",
        type="midi",
        instrument="lead",
        channel=1,
        regions=[region],
    )
    return Project(
        id=uuid4(),
        title="Render Test",
        description="Minimal project for render testing",
        style="ambient",
        bpm=120,
        key="C",
        scale="minor",
        time_signature=[4, 4],
        bars=4,
        tracks=[track],
    )


def test_render_project_exports_midi_fallback() -> None:
    """When DawDreamer is unavailable the renderer should still export MIDI."""
    project = _minimal_project()
    result = render_project(project)

    assert result["midi_path"]
    assert Path(result["midi_path"]).exists()
    assert result["output_path"] is None or result.get("success") is False
    assert "diagnostic" in result
