"""
Offline render prototype using DawDreamer.

DawDreamer (https://github.com/DBraun/DawDreamer) is a Python DAW engine
that can host VST3/AU plugins and render a MIDI file to a WAV file. This
module exposes a thin wrapper around it so GRAVSYSTEM projects can be
rendered server-side.

Because DawDreamer does not publish wheels for every Python version or
platform, the import is optional. When it is unavailable the module falls
back to exporting a Standard MIDI File and returning a clear diagnostic
message.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
import traceback
import warnings
from pathlib import Path
from typing import Any

# Add packages/core/py to path so we can import shared schemas.
sys.path.append(str(Path(__file__).parent.parent.parent / "packages" / "core" / "py"))

from schemas import Project
from midi_export import project_to_midi_bytes

try:
    import dawdreamer as daw  # type: ignore[import-not-found]

    DAWDREAMER_AVAILABLE = True
except Exception:  # noqa: BLE001
    DAWDREAMER_AVAILABLE = False


def _default_output_path(project: Project) -> Path:
    safe_title = "".join(c if c.isalnum() or c in "-_ " else "_" for c in project.title)
    return Path(tempfile.gettempdir()) / f"{safe_title}.wav"


def _midi_path_for_project(project: Project) -> Path:
    safe_title = "".join(c if c.isalnum() or c in "-_ " else "_" for c in project.title)
    return Path(tempfile.gettempdir()) / f"{safe_title}.mid"


def _build_synth_plugin_path() -> str | None:
    """Return a path to a built-in synth plugin if one is bundled with DawDreamer."""
    # DawDreamer ships with a few example plugins; prefer a simple poly-synth.
    if not DAWDREAMER_AVAILABLE:
        return None
    # The exact bundled plugin names vary by platform/version.
    candidates = ["DavideSynth", "SineWaveSynth"]
    for name in candidates:
        try:
            engine = daw.RenderEngine(44100, 512)
            plugin = engine.make_plugin_processor(name, name)
            if plugin is not None:
                return name
        except Exception:  # noqa: BLE001
            continue
    return None


def _render_with_dawdreamer(
    project: Project,
    output_path: Path,
    sample_rate: int = 44100,
    block_size: int = 512,
    plugin_path: str | None = None,
) -> dict[str, Any]:
    """Render a project to WAV using DawDreamer."""
    if not DAWDREAMER_AVAILABLE:
        raise RuntimeError("DawDreamer is not installed or failed to import.")

    midi_path = _midi_path_for_project(project)
    midi_path.write_bytes(project_to_midi_bytes(project))

    engine = daw.RenderEngine(sample_rate, block_size)

    # Use a user-supplied plugin path or fall back to a bundled synth.
    synth_name = plugin_path or _build_synth_plugin_path()
    if synth_name is None:
        raise RuntimeError(
            "No suitable synth plugin found. Pass --plugin-path pointing to a VST3/AU instrument."
        )

    synth = engine.make_plugin_processor("synth", synth_name)
    synth.add_midi_track(midi_path)

    engine.load_graph([synth])
    engine.set_bpm(project.bpm)
    engine.set_time_signature(project.time_signature[0], project.time_signature[1])

    duration_seconds = project.bars * 4 * (60.0 / project.bpm)
    engine.render(duration_seconds)
    audio = engine.get_audio()

    # DawDreamer returns audio as a NumPy array; write it via scipy or soundfile.
    try:
        import soundfile as sf  # type: ignore[import-not-found]

        sf.write(output_path, audio.transpose(), sample_rate)
    except Exception as exc:  # noqa: BLE001
        raise RuntimeError(
            "Audio was rendered but could not be written. "
            "Install soundfile (`pip install soundfile`) to export WAV."
        ) from exc

    return {
        "success": True,
        "output_path": str(output_path),
        "sample_rate": sample_rate,
        "duration_seconds": duration_seconds,
        "plugin": synth_name,
        "midi_path": str(midi_path),
    }


def render_project(
    project: Project,
    output_path: Path | None = None,
    sample_rate: int = 44100,
    block_size: int = 512,
    plugin_path: str | None = None,
) -> dict[str, Any]:
    """
    Render a GRAVSYSTEM project to audio.

    If DawDreamer is available, a WAV file is produced. Otherwise a MIDI file
    is exported and a diagnostic message is returned so the caller can decide
    how to proceed (e.g. import the MIDI into Reaper/Logic/Carla manually).
    """
    out = output_path or _default_output_path(project)

    if DAWDREAMER_AVAILABLE:
        try:
            return _render_with_dawdreamer(
                project, out, sample_rate, block_size, plugin_path
            )
        except Exception as exc:  # noqa: BLE001
            warnings.warn(f"DawDreamer render failed: {exc}")
            traceback.print_exc()

    # Fallback: export MIDI only.
    midi_path = _midi_path_for_project(project)
    midi_path.write_bytes(project_to_midi_bytes(project))
    return {
        "success": False,
        "output_path": None,
        "midi_path": str(midi_path),
        "diagnostic": (
            "DawDreamer is not available or the render failed. "
            "A Standard MIDI File was exported instead; import it into a DAW "
            "such as Reaper, Logic Pro, or Carla to render audio."
        ),
        "dawdreamer_available": DAWDREAMER_AVAILABLE,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Render a GRAVSYSTEM project to audio or MIDI using DawDreamer."
    )
    parser.add_argument("project", help="Path to a JSON file containing a GRAVSYSTEM Project.")
    parser.add_argument("--output", "-o", type=Path, help="Output WAV file path.")
    parser.add_argument("--plugin-path", help="Path to a VST3/AU instrument plugin.")
    parser.add_argument("--sample-rate", type=int, default=44100)
    parser.add_argument("--block-size", type=int, default=512)
    args = parser.parse_args()

    project_path = Path(args.project)
    if not project_path.exists():
        print(f"Project file not found: {project_path}", file=sys.stderr)
        return 1

    project = Project.model_validate_json(project_path.read_text())
    result = render_project(
        project,
        output_path=args.output,
        sample_rate=args.sample_rate,
        block_size=args.block_size,
        plugin_path=args.plugin_path,
    )

    print(json.dumps(result, indent=2))
    return 0 if result.get("success") else 2


if __name__ == "__main__":
    raise SystemExit(main())
