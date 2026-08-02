"""Generate minimal synthetic drum samples and save as WAV files."""

import math
import struct
import wave
from pathlib import Path

SAMPLE_RATE = 44100
OUTPUT_DIR = Path(__file__).parent.parent / "web" / "public" / "samples"


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        for s in samples:
            f.writeframes(struct.pack("<h", int(max(-1, min(1, s)) * 32767)))


def generate_kick(duration: float = 0.5) -> list[float]:
    n = int(SAMPLE_RATE * duration)
    samples: list[float] = []
    for i in range(n):
        t = i / SAMPLE_RATE
        freq = 150 * math.exp(-t * 30)
        env = math.exp(-t * 8)
        samples.append(math.sin(2 * math.pi * freq * t) * env)
    return samples


def generate_snare(duration: float = 0.25) -> list[float]:
    n = int(SAMPLE_RATE * duration)
    samples: list[float] = []
    for i in range(n):
        t = i / SAMPLE_RATE
        noise = (hash(i) % 1000 - 500) / 500
        tone = math.sin(2 * math.pi * 180 * t)
        env = math.exp(-t * 25)
        samples.append((noise * 0.7 + tone * 0.3) * env)
    return samples


def generate_hihat(duration: float = 0.08) -> list[float]:
    n = int(SAMPLE_RATE * duration)
    samples: list[float] = []
    for i in range(n):
        t = i / SAMPLE_RATE
        noise = (hash(i) % 1000 - 500) / 500
        env = math.exp(-t * 60)
        # High-pass-ish via sign flips / pseudo ring mod
        samples.append(noise * env * 0.5)
    return samples


def generate_clap(duration: float = 0.2) -> list[float]:
    n = int(SAMPLE_RATE * duration)
    samples: list[float] = []
    for i in range(n):
        t = i / SAMPLE_RATE
        noise = (hash(i) % 1000 - 500) / 500
        env1 = math.exp(-t * 40)
        env2 = math.exp(-((t - 0.02) ** 2) * 5000)
        samples.append(noise * (env1 * 0.5 + env2 * 0.5))
    return samples


def main() -> None:
    write_wav(OUTPUT_DIR / "kick.wav", generate_kick())
    write_wav(OUTPUT_DIR / "snare.wav", generate_snare())
    write_wav(OUTPUT_DIR / "hihat.wav", generate_hihat())
    write_wav(OUTPUT_DIR / "clap.wav", generate_clap())
    print(f"Samples written to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
