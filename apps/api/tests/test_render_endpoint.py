import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent / "packages" / "core" / "py"))

from uuid import uuid4

from fastapi.testclient import TestClient
from main import app
from schemas import Project, Track, Region, MidiEvent

client = TestClient(app)


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


def test_render_endpoint_returns_response() -> None:
    project = _minimal_project()
    response = client.post("/api/render", json=project.model_dump(mode="json"))

    assert response.status_code == 200
    content_type = response.headers.get("content-type", "")

    if "audio/wav" in content_type:
        assert len(response.content) > 44  # WAV header is 44 bytes
    else:
        data = response.json()
        assert data["success"] is False
        assert "diagnostic" in data
        assert "midi" in data
        assert data["dawdreamer_available"] is False
