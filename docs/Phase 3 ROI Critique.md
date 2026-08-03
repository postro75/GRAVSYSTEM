> Poprzednia faza: [[Phase 2 ROI Critique]]

# GRAVSYSTEM — Phase 3 ROI Critique

## Co zostało dostarczone

1. **Nowy silnik audio oparty na SoundFontach i sample'ach** — `lib/audio-engine.ts` zastępuje proste syntezatory Tone.js:
   - Perkusja: lokalne sample WAV (kick, snare, hihat, clap) z efektami master.
   - Melodia: `smplr` SoundFont (`FluidR3_GM`) dopasowany do stylu (Jarre, synthwave, techno, dance, ambient).
   - Efekty: reverb, delay, chorus, compressor, limiter.
   - Sidechain: kick tłumi basy/pady jak w prawdziwym mixie.
2. **MIDI export** — endpoint `/api/export/midi` w FastAPI zwraca plik `.mid` z aktualnego projektu; frontend ma przycisk "Export MIDI".
3. **Undo/redo w piano roll** — historia zmian, przyciski i skrót Cmd/Ctrl+Z.
4. **Przygotowanie do deploymentu backendu**:
   - `apps/api/Dockerfile`
   - `apps/api/Procfile` (Elastic Beanstalk fallback)
   - `render.yaml` (Render Blueprint)
   - `requirements.txt` uzupełnione o `mido`
5. **Czysty CI** — ESLint zero błędów/zero warningów; testy web (11) i API (6) przechodzą.
6. **Vercel deploy** — produkcja działa: https://vercel-app-pink-xi.vercel.app

## Weryfikacja

- `npm run ci` ✅ lint + type-check + 11 testów web.
- `pytest tests -q` w `apps/api` ✅ 6 testów (w tym nowy test exportu MIDI).
- Vercel build i deploy ✅.
- `/api/generate` na Vercelu zwraca Project JSON ze stylem ✅.

## Bloker: deployment backendu

Nie udało się zdeployować FastAPI na Render ani AWS z powodu braku credentials:

- **Render** — CLI wymaga logowania przez przeglądarkę lub `RENDER_API_KEY`; nie znaleziono klucza w systemie.
- **AWS** — konto `PO` ma ograniczone uprawnienia: brak dostępu do Elastic Beanstalk, ECS, App Runner.
- **Fly.io / Railway** — brak zainstalowanych CLI i tokenów.

Pliki konfiguracyjne są gotowe; wystarczy podać klucz API Render lub uprawnienia AWS, aby wdrożyć.

## Krytyka ROI

### Najwyższy ROI: TAK

- **SoundFont + sidechain** — największy skok jakościowy preview. Produkt brzmi teraz jak demo DAW, nie jak zabawka.
- **MIDI export** — kluczowa funkcja: użytkownik może wyeksportować projekt do dowolnego DAW (Logic, Ableton, REAPER).
- **Undo/redo** — podstawa profesjonalnego edytora. Bez tego użytkownik boi się edytować.

### Średni ROI: DO ZASTANOWIENIA

- **SoundFont ładujący się z GitHub Pages** — prosty start, ale rate limit i brak kontroli nad sample'ami. W Phase 4 warto rozważyć własne sample packi lub Splice.
- **Fallback Next.js API dla generacji** — działa, ale duplikuje logikę. Konsolidacja na FastAPI po deployu backendu jest priorytetem.

### Niski ROI / strata czasu

- **Próby deployu AWS/EB/App Runner bez uprawnień** — stracony czas z powodu braku credentials. Warto najpierw sprawdzić permissions, zanim zaczniemy konfigurować kolejną platformę.

## Rekomendacje przed Phase 4

1. **Uzyskaj Render API key i wdroż backend**
   - Wygeneruj klucz w Render Dashboard → Account Settings → API Keys.
   - Ustaw `RENDER_API_KEY` i uruchom `render blueprint apply` lub połącz repo przez dashboard.
   - Ustaw `NEXT_PUBLIC_API_URL=<render-url>` w Vercel i przełącz frontend na FastAPI.

2. **Persistencja projektów**
   - Dodaj PostgreSQL (Render managed) i CRUD `/api/projects`.
   - Auto-save stanu projektu przy każdej edycji.

3. **Lepsze sample'y i instrumenty**
   - Zamień SoundFont GM na dedykowane sample packi (808/909, analogowe syntezatory).
   - Dodaj automation (filtrowanie, decay) per track.

4. **Render audio (opcjonalnie)**
   - Dopiero gdy użytkownicy będą płacić za gotowe WAV. Na razie MIDI export + browser preview wystarcza.

5. **UX/usprawnienia**
   - Zoom w timeline i piano roll.
   - Metronom i licznik taktów.
   - Drag & drop regionów na timeline.

## Decyzje do podjęcia

- **Backend deployment:** Render (rekomendowane) vs AWS (wymaga szerszych uprawnień).
- **Sample'y:** SoundFont (szybkie) vs dedykowane sample packi (lepsze brzmienie, więcej pracy).
- **Render audio:** czy wdrażać w Phase 4, czy dopiero po monetizacji?

## Go / No-Go

**GO** dla Phase 4 — dźwięk i edycja są na poziomie prototypu gotowego do pokazu. Następny krok to wdrożenie backendu i persistencja.
