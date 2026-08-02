from typing import Any
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path

# Add packages/core/py to path so we can import shared schemas
sys.path.append(str(Path(__file__).parent.parent.parent / "packages" / "core" / "py"))

from schemas import Project, GenerationRequest

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


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "gravsystem-api", "version": "1.0.0"}


@app.get("/api/schema/project")
def get_project_schema() -> dict[str, Any]:
    return Project.model_json_schema()


@app.post("/api/generate")
def generate_project(request: GenerationRequest) -> dict[str, Any]:
    """Generate a minimal placeholder project from a text description."""
    project = Project(
        title=request.description[:60] or "Generated Project",
        description=request.description,
        bpm=request.bpm or 120.0,
        key=request.key or "C",
        scale=request.scale or "minor",
        bars=request.bars or 16,
    )
    return {
        "success": True,
        "project": project.model_dump(mode="json"),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "GRAVSYSTEM API is running"}
