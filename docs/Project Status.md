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
