from typing import Literal, Optional
from uuid import uuid4
from pydantic import BaseModel, Field, UUID4


class MidiEvent(BaseModel):
    pitch: int = Field(..., ge=0, le=127)
    velocity: int = Field(default=100, ge=0, le=127)
    start: float = Field(..., ge=0)  # beats
    duration: float = Field(..., gt=0)  # beats


class Effect(BaseModel):
    type: Literal["eq", "compressor", "reverb", "delay", "filter", "limiter", "chorus", "distortion"]
    parameters: dict[str, float | str | bool] = Field(default_factory=dict)


class Region(BaseModel):
    id: UUID4 = Field(default_factory=uuid4)
    track_id: UUID4
    name: str = "Region"
    start_beat: float = Field(default=0, ge=0)
    duration: float = Field(..., gt=0)
    type: Literal["midi", "audio"]
    midi_events: list[MidiEvent] = Field(default_factory=list)
    audio_url: Optional[str] = None
    transpose: int = 0
    gain: float = 1.0


class Track(BaseModel):
    id: UUID4 = Field(default_factory=uuid4)
    name: str
    type: Literal["midi", "audio", "group", "return"]
    instrument: Optional[str] = None
    channel: int = Field(default=1, ge=1, le=128)
    regions: list[Region] = Field(default_factory=list)
    volume: float = Field(default=1.0, ge=0, le=2)
    pan: float = Field(default=0.0, ge=-1, le=1)
    mute: bool = False
    solo: bool = False
    effects: list[Effect] = Field(default_factory=list)


class Project(BaseModel):
    id: UUID4 = Field(default_factory=uuid4)
    owner_id: Optional[str] = None
    title: str = "Untitled Project"
    description: str = ""
    style: str = "dance"
    bpm: float = Field(default=120.0, gt=0)
    key: str = "C"
    scale: Literal["major", "minor"] = "minor"
    time_signature: tuple[int, int] = (4, 4)
    bars: int = Field(default=16, gt=0)
    tracks: list[Track] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat())
    version: int = 1


class GenerationRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=2000)
    style: str = "dance"
    bpm: Optional[float] = None
    key: Optional[str] = None
    scale: Optional[Literal["major", "minor"]] = None
    bars: Optional[int] = None
