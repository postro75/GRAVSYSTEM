> Poprzednia faza: [[Phase 1 ROI Critique]]

# GRAVSYSTEM — Phase 2 ROI Critique

## Co zostało dostarczone

1. **Browser piano-roll editor** — `components/daw/PianoRoll.tsx` pozwala dodawać, usuwać, zaznaczać i przesuwać nuty na siatce MIDI.
2. **Region click → editor** — kliknięcie regionu na timeline otwiera piano roll dla tego regionu.
3. **Transport podłączony do Tone.js** — Play / Pause / Stop sterują `Tone.Transport`; przycisk Play podświetla się podczas odtwarzania.
4. **Playback cursor na timeline** — pionowa linia pozycji śledzi bieżący czas transportu.
5. **Aktualizacja projektu z editora** — zmiany w piano rollu aktualizują stan projektu i przeładowują silnik audio.
6. **Backend consolidation plan** — dokument wybiera FastAPI jako jedyny backend i proponuje deployment na Render (web + worker + Postgres + Redis).
7. **Czysty CI** — ESLint zero błędów/zero warningów; testy web (11) i API (5) przechodzą.
8. **Vercel deploy** — produkcja działa: https://vercel-app-pink-xi.vercel.app

## Weryfikacja

- `npm run ci` ✅ lint + type-check + 11 testów web.
- `pytest tests -q` w `apps/api` ✅ 5 testów.
- Vercel build i deploy ✅.
- Piano roll otwiera się po kliknięciu regionu ✅.
- Nuty można dodawać, przesuwać i usuwać ✅.

## Krytyka ROI

### Najwyższy ROI: TAK

- **Piano roll z edycją MIDI** — to jest moment, w którym produkt przestaje być zabawką i zaczyna być narzędziem. Użytkownik może poprawić to, co wygenerował LLM.
- **Transport + cursor** — podstawowa funkcja DAW. Bez tego timeline był tylko podglądem.
- **Backend consolidation plan** — decyzja, która oszczędzi dziesiątki godzin w przyszłości. Jednoźródłowy backend Python to najlepsza droga do renderu offline i profesjonalnych bibliotek audio.
- **Czysty ESLint** — zero warningów utrzymuje prędkość i jakość code review.

### Średni ROI: DO ZASTANOWIENIA

- **Synteza Tone.js brzmi jak "laser"** — perkusja to sample, ale basy/pady/lead używają prostych syntezatorów Web Audio. Dla stylu Jarre/Kavinsky brakuje głębi, unison, detune, filtrów.
  - **Rekomendacja:** Phase 3 powinien dodać lepsze sample packi (808/909) i bardziej złożone instrumenty Tone.js (FM, AM, FatOscillator, Noise) albo integrację z SoundFonts.
- **Brak persistencji projektów** — wszystko trzyma się w pamięci przeglądarki. Odświeżenie strony = utrata pracy.
  - **Rekomendacja:** najpierw localStorage auto-save, potem backend CRUD z Postgres.
- **Export MIDI dopiero w planie** — użytkownik nie może jeszcze pobrać `.mid` z edytowanego projektu.

### Niski ROI / strata czasu

- **Rozbudowa UI przed lepszym dźwiękiem** — obecnie UX jest schludny, ale preview wciąż brzmi amatorsko. Lepszy dźwięk da większy ROI niż kolejne wizualne poprawki.
- **Integracja z Logic Pro / GarageBand na tym etapie** — natywne DAW-y mają zamknięte API i wymagają AudioUnit / VST. Dla MVP lepszy jest export MIDI/REAPER, który użytkownik importuje ręcznie.

## Rekomendacje przed Phase 3

1. **Lepszy dźwięk — najwyższy priorytet**
   - Zamienić syntetyczne instrumenty na sample-based (SoundFont, Decent Sampler, Splice one-shots).
   - Dodać efekty: sidechain na basie, chorus na padach, delay na arpeggiach.
   - Dodać velocity i humanize do wygenerowanych nut.

2. **Persistencja i export**
   - Auto-save do `localStorage`.
   - Endpoint `/api/projects` do zapisywania/ładowania projektów.
   - Export `.mid` z aktualnego stanu projektu.

3. **Hostowanie FastAPI**
   - Zdeployować `apps/api` na Render/Railway/Fly według `Backend Consolidation Plan.md`.
   - Ustawić `NEXT_PUBLIC_API_URL` w Vercel.
   - Dodać CORS i health check.

4. **Lepsza generacja stylistyczna**
   - Presety: Jean-Michel Jarre (analogowe sekwencje, długie pady), Kavinsky (bity 80s, syntezatory), Guetta (big-room house).
   - Użyć LLM (Grok/Kimi) do strukturyzacji promptu, ale nuty generować rule-based dla powtarzalności.

5. **UX/usprawnienia DAW**
   - Zoom w timeline i piano roll.
   - Undo/redo dla edycji nut.
   - Metronom i licznik taktów.

## Decyzje do podjęcia

- **Instrumenty: sample vs synteza?**
  - **Rekomendacja:** sample-based dla perkusji i basu, synteza (FM/Fat) dla padów/leadów. Balans jakości i rozmiaru.
- **Backend host: Render, Railway czy Fly?**
  - **Rekomendacja:** Render — najprostszy web + worker + Postgres + Redis w jednym pliku `render.yaml`.
- **Czy budować własny audio render worker?**
  - **Rekomendacja:** najpierw ulepszyć browser preview. Render worker (DawDreamer) dopiero gdy użytkownicy będą płacić za wysokiej jakości WAV.

## Go / No-Go

**GO** dla Phase 3 — podstawowy DAW shell działa. Następny krok to jakość dźwięku, persistencja i profesjonalny hosting backendu.
