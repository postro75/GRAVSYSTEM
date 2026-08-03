# GRAVSYSTEM — Project Status

## Co działa teraz

- UI z 5 presetami ze zdjęciami i ikonami.
- Algorytmiczna generacja MIDI/REAPER z opisu naturalnego języka.
- **Browser preview przez Tone.js** — odtwarzanie wygenerowanego projektu bezpośrednio w przeglądarce.
- **Pro render przez Stable Audio API** — przycisk generujący gotowy audio WAV w stylu.
- Eksport: `.mid` + `.rpp` (REAPER z osadzonym MIDI).

## Ostatnie zmiany

- Dodano `tone` jako zależność.
- Nowy silnik: `lib/tone-engine.ts`.
- Nowy komponent: `components/TonePreviewButton.tsx`.
- Nowy endpoint: `app/api/render-stable/route.ts`.
- Zaktualizowany `components/ProjectCard.tsx` — preview i pro-render obok siebie.
- Utworzono dokumentację strategiczną:
  - `docs/Benchmark and Gap Analysis.md`
  - `docs/Product Specification.md`
  - `docs/Technical Architecture.md`
  - `docs/Roadmap.md`
- **Phase 0 — Foundation ukończona:**
  - Monorepo `apps/web`, `apps/api`, `packages/core`.
  - GitHub Actions CI, Docker Compose (Postgres + Redis).
  - DAW shell: prompt bar, transport, timeline.
  - FastAPI scaffold z shared Zod/Pydantic schemas.
  - Vercel production deploy: https://vercel-app-pink-xi.vercel.app
  - `docs/Phase 0 ROI Critique.md`
- **Phase 1 — Text-to-MIDI Core ukończona:**
  - FastAPI `/api/generate` zwraca Project JSON z MIDI events.
  - Pythonowa logika generowania: `music_theory.py` + `pattern_generator.py`.
  - Frontend renderuje wygenerowane regiony na timeline.
  - Sample-based preview (kick, snare, hihat, clap).
  - Next.js API fallback dla Vercel preview.
  - ESLint zero błędów/zero warningów.
  - `docs/Phase 1 ROI Critique.md`
- **Phase 2 — Browser DAW UI ukończona:**
  - Piano-roll editor: dodawanie, zaznaczanie, przesuwanie, usuwanie nut.
  - Kliknięcie regionu na timeline otwiera piano roll.
  - Transport Play/Pause/Stop steruje `Tone.Transport`.
  - Playback cursor na timeline.
  - Zmiany w piano rollu aktualizują projekt i przeładowują audio.
  - `docs/Backend Consolidation Plan.md` — konsolidacja backendu na FastAPI + Render.
  - `docs/Phase 2 ROI Critique.md`

## Wymagane zmienne środowiskowe

```bash
# Opcjonalne — tylko jeśli chcesz używać Pro Render (Stable Audio)
STABLE_AUDIO_API_KEY=sk-...
```

Bez klucza endpoint zwraca błąd 503 z informacją, że klucz nie jest skonfigurowany.

## Testy

```bash
npm test       # 11/11 testów
npm run build  # czysty build
```

## Deploy

```bash
vercel deploy --prod --yes
```

## Linki

- Repo: https://github.com/postro75/GRAVSYSTEM
- Produkcja Vercel: https://vercel-app-pink-xi.vercel.app
