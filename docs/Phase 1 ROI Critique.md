> Poprzednia faza: [[Phase 0 ROI Critique]]

# GRAVSYSTEM — Phase 1 ROI Critique

## Co zostało dostarczone

1. **Prawdziwy text-to-MIDI** — backend FastAPI `/api/generate` zwraca pełny Project JSON z MIDI events.
2. **Pythonowa logika generowania** — `music_theory.py` + `pattern_generator.py` (skale, akordy, progresje, patterny perkusji, basu, arpeggio, akordów, leadu).
3. **Frontend renderuje regiony** — timeline wyświetla wygenerowane tracki i regiony z MIDI events.
4. **Sample-based preview** — perkusja używa sample'ów WAV (kick, snare, hihat, clap) zamiast czystej syntezy.
5. **Fallback Next.js API** — `/api/generate` działa również bez FastAPI (np. na Vercel preview).
6. **Czysty CI** — ESLint zero błędów, zero warningów; testy web i API przechodzą.
7. **Vercel deploy** — produkcja działa: https://vercel-app-pink-xi.vercel.app

## Weryfikacja

- `npm run ci` ✅ lint + type-check + 11 testów web.
- `pytest tests -q` w `apps/api` ✅ 5 testów.
- Vercel build i deploy ✅.
- `/api/generate` na Vercelu zwraca Project JSON z midiEvents ✅.

## Krytyka ROI

### Najwyższy ROI: TAK

- **Text-to-MIDI w backendzie** — fundament pod cały produkt. Warto.
- **Sample-based preview** — największy wzrost percepcji jakości przy niskim koszcie.
- **Czysty ESLint** — utrzymuje prędkość developmentu.

### Średni ROI: DO ZASTANOWIENIA

- **Duplikacja logiki** — generowanie jest teraz w Pythonie (FastAPI) i TypeScript (Next.js fallback). Koszt utrzymania rośnie.
  - **Rekomendacja:** Phase 2 powinien ujednolicić logikę — albo całość w Pythonie (FastAPI jako główny backend), albo całość w TS (Vercel functions).
- **Brak hostingu FastAPI** — API działa tylko lokalnie. Do produkcji trzeba hostować osobno.

### Niski ROI / strata czasu

- Generowanie sample'ów syntetycznych w Pythonie — brzmi lepiej niż synteza, ale wciąż prymitywne. W Phase 2 warto zastąpić profesjonalnymi sample packami (np. 808, 909) lub integracją z Splice.

## Rekomendacje przed Phase 2

1. **Piano roll + edycja MIDI**
   - Użytkownik musi móc edytować wygenerowane nuty.
   - Największy wzrost kontroli i wartości produktu.

2. **Ujednolicenie backendu**
   - Wybrać jeden stack generowania: FastAPI (rekomendowane) lub Next.js functions.
   - Jeśli FastAPI — zdeployować na Render/Railway/Fly i ustawić `API_URL` w Vercel.

3. **Lepsze sample'y**
   - Zamienić syntetyczne WAV na prawdziwe sample perkusji.
   - Dodać sample dla innych instrumentów (bass, pad) opcjonalnie.

4. **Transport/play w DAW shell**
   - Obecnie transport jest placeholderem. Podłączyć odtwarzanie do timeline.

5. **Export MIDI z backendu**
   - `/api/generate` powinien opcjonalnie zwracać plik `.mid`.

## Decyzje do podjęcia

- **Stack generowania:** FastAPI (Python) vs Next.js functions (TS)?
  - **Rekomendacja:** FastAPI — lepszy ekosystem dla audio (mido, music21, DawDreamer), łatwiejsza droga do renderu offline.
- **Hostowanie FastAPI:** Render, Railway, Fly, czy AWS Lambda?
  - **Rekomendacja:** Render lub Railway dla prostoty, ~$7–25/mies.

## Go / No-Go

**GO** dla Phase 2 — produkt ma już działającą generację i preview. Następny krok to edycja i konsolidacja architektury.
