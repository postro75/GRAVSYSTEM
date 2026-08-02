# GRAVSYSTEM — Phase 0 ROI Critique

## Co zostało dostarczone

1. **Monorepo** `apps/web`, `apps/api`, `packages/core` z npm workspaces.
2. **CI/CD** — GitHub Actions lint, type-check, tests dla web i API.
3. **Docker Compose** — Postgres + Redis gotowe do uruchomienia.
4. **Frontend DAW shell** — prompt bar, transport, timeline, classic generator.
5. **Backend API scaffold** — FastAPI z `/health`, `/api/schema/project`, `/api/generate`.
6. **Shared schemas** — Zod (TS) + Pydantic (Python) dla Project/Track/Region/MidiEvent/Effect.
7. **Vercel deployment** — produkcyjny deploy działa: https://vercel-app-pink-xi.vercel.app

## Weryfikacja

- `npm run ci` przechodzi lokalnie (lint z warningami, type-check, 11 testów).
- API testy przechodzą (3/3).
- Docker Compose plik jest gotowy (docker nie był zainstalowany lokalnie, więc nie uruchamiany).
- Vercel build zakończony sukcesem.

## Krytyka ROI — co działa, co nie

### Najwyższy ROI: TAK

- **Monorepo + shared schemas** — jednorazowy koszt, zyskuje każda kolejna faza. Warto.
- **Vercel deployment** — natychmiastowa weryfikacja, można pokazywać/postępować iteracyjnie.
- **CI/CD** — zapobiega regresjom, must-have przy wielu fazach.

### Średni ROI: DO ZASTANOWIENIA

- **FastAPI backend jako osobna usługa** — na Phase 0 warto, ale do produkcji trzeba będzie hostować (Railway/Render/Fly). Koszt ~$5–20/mies.
- **Docker Compose** — przydatne lokalnie, ale w Phase 1 jeszcze nie używamy bazy danych. Można było odłożyć, ale nie przeszkadza.

### Niski ROI / strata czasu

- **Zbyt wczesne pisanie testów API** — endpoint `/api/generate` zwraca placeholder. Testy są proste, ale w następnej fazie i tak zostaną wymienione na prawdziwy generator. Nie przesadzajmy z testami placeholderów.
- **Eslint konfiguracja** — połowa warningów to unused variables z istniejącego kodu. Warto poświęcić 15 min na cleanup, żeby nie narastało.

## Rekomendacje przed Phase 1

1. **Najwyższy priorytet: prawdziwy text-to-MIDI.**
   - Połączyć istniejący `lib/music.ts` + `lib/midi.ts` z endpointem `/api/generate` backendu.
   - Backend powinien zwracać Project JSON z MIDI events, nie placeholder.
   - Frontend powinien renderować te regiony na timeline.

2. **Sample-based preview.**
   - Tone.js brzmi jak "laser" bo używa syntezatorów.
   - Zamiana na sample kick/snare/hihat natychmiast podnosi jakość.
   - To największy wzrost percepcji jakości przy niskim koszcie.

3. **Wyczyść warningi ESLint.**
   - Usuń/zakomentuj unused variables.
   - To 15 minut roboty, poprawia czytelność.

4. **API URL dla preview.**
   - Obecnie `/api/health` przekierowuje na `localhost:8000`.
   - Dla Vercel preview trzeba ustawić `API_URL` env var albo zrobić proxy w Next.js API routes.

5. **Nie budujemy własnego DAW engine jeszcze.**
   - Timeline jest placeholderem. W Phase 1 wystarczy wyświetlanie regionów.
   - Piano roll / mixer to Phase 2+, inaczej zbyt duży koszt bez walidacji użytkownika.

## Decyzje do podjęcia

- Czy hostować API na Vercel (serverless functions) czy osobnej usłudze?
  - **Rekomendacja:** Vercel functions dla prostych endpointów, osobna usługa tylko dla renderu DawDreamer (GPU/CPU).
- Jaki budżet miesięczny na LLM (Grok/Kimi) i Stable Audio?
  - **Rekomendacja:** zacząć od $50 miesięcznie, monitorować koszt per generation.

## Go / No-Go

**GO** dla Phase 1 — foundation jest stabilne, następny krok to prawdziwa generacja MIDI z opisu.
