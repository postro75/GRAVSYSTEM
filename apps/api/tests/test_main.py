import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent / "packages" / "core" / "py"))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "gravsystem-api"


def test_project_schema() -> None:
    response = client.get("/api/schema/project")
    assert response.status_code == 200
    schema = response.json()
    assert "properties" in schema
    assert "tracks" in schema["properties"]


def test_generate_project() -> None:
    response = client.post(
        "/api/generate",
        json={
            "description": "Ambient space track, 90 BPM, D minor, 16 bars",
            "style": "ambient",
            "bpm": 90,
            "key": "D",
            "scale": "minor",
            "bars": 16,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["project"]["title"] == "Ambient space track, 90 BPM, D minor, 16 bars"
    assert data["project"]["bpm"] == 90


def test_generate_project_has_midi_events() -> None:
    response = client.post(
        "/api/generate",
        json={
            "description": "Dance track with drums, bass, chords and lead",
            "style": "dance",
            "bpm": 128,
            "bars": 16,
        },
    )
    assert response.status_code == 200
    data = response.json()
    tracks = data["project"]["tracks"]
    assert len(tracks) >= 4
    track_names = {t["name"] for t in tracks}
    assert "Drums" in track_names
    assert "Bass" in track_names
    assert "Chords" in track_names
    assert "Lead" in track_names

    drums = next(t for t in tracks if t["name"] == "Drums")
    assert len(drums["regions"]) == 1
    assert len(drums["regions"][0]["midi_events"]) > 0


def test_generate_jarre_style() -> None:
    response = client.post(
        "/api/generate",
        json={"description": "Jean-Michel Jarre ambient space", "style": "jarre"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["config"]["style"] == "jarre"
    assert data["config"]["bpm"] == 108
    tracks = data["project"]["tracks"]
    assert any("Arpeggio" in t["name"] for t in tracks)


def test_export_midi() -> None:
    response = client.post(
        "/api/generate",
        json={"description": "Dance track", "style": "dance", "bpm": 120, "bars": 8},
    )
    assert response.status_code == 200
    project = response.json()["project"]

    response = client.post("/api/export/midi", json=project)
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/midi"
    assert response.headers["content-disposition"].endswith('.mid"')
    assert len(response.content) > 0
