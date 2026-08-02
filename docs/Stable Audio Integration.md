# Stable Audio Pro Render

## Endpoint

`POST /api/render-stable`

### Request

```json
{
  "config": {
    "description": "...",
    "style": "jarre",
    "bpm": 108,
    "bars": 32,
    "key": "D",
    "scale": "minor",
    "chordProgression": [...],
    "trackLayout": [...],
    "patternTypes": {...}
  }
}
```

### Response

```json
{
  "success": true,
  "wav": "<base64>",
  "duration": 71,
  "prompt": "ambient electronic space music... 108 BPM, D minor..."
}
```

## Prompt engineering

Prompt budowany automatycznie na podstawie:
- stylu (mapowanie na opis stylistyczny),
- BPM,
- tonacji i skali,
- liczby taktów.

Przykład dla Jarre:
> ambient electronic space music in the style of Jean-Michel Jarre, analog synthesizers, arpeggios, warm pads, 108 BPM, D minor, 32 bars, instrumental, high quality production

## Konfiguracja

```bash
STABLE_AUDIO_API_KEY=sk-...
```

Klucz można wygenerować na https://platform.stability.ai.

## Ceny (przybliżone)

- Stable Audio 2.5: ~20 credits / generacja
- Stable Audio 3.0: ~26 credits / generacja
- 1 credit ≈ $0.01

## Zastępcze API

Jeśli Stability AI jest niedostępne, można przepiąć endpoint na AIMLAPI:
- URL: `https://api.aimlapi.com/v2/generate/audio`
- Body: `{ "model": "stable-audio", "prompt": "...", "seconds_total": 71 }`
- Wymaga osobnego klucza AIMLAPI.

## Pomysły na rozbudowę

- Dodać wybór modelu (Stable Audio 2.5 vs 3.0).
- Dodać seed dla reprodukowalności.
- Dodać audio-to-audio (upload własnego audio i transformacja).
- Cache wyników po stronie serwera (Redis / Vercel KV).
