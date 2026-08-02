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
