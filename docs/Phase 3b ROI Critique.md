> Poprzednia faza: [[Phase 3 ROI Critique]]

# GRAVSYSTEM — Phase 3b ROI Critique (Local-first desktop MVP pivot)

## Co zostało dostarczone

1. **MIDI export w przeglądarce** — przeniesiony z FastAPI do frontendu (`lib/midi-export.ts` via `@tonejs/midi`). Działa offline, bez backendu.
2. **Persistencja projektów** — projekty auto-zapisywane do `localStorage`; po odświeżeniu strony użytkownik wraca do ostatniego projektu.
3. **Lista projektów z możliwością przełączania** — kliknięcie projektu ładuje go do DAW.
4. **Desktop wrapper** — Electron w folderze `apps/web/electron/`:
   - `electron/main.js` — okno 1400×900, ładuje `localhost:3000` w dev lub `dist/index.html` w buildzie.
   - `electron/preload.js` — bezpieczny bridge.
   - Skrypty: `npm run electron:dev` (wymaga `npm run dev`).
5. **Vercel deploy działa** — produkcja nadal działa bez backendu: https://vercel-app-pink-xi.vercel.app
6. **Czysty CI** — `npm run ci` ✅, `pytest` ✅.

## Weryfikacja

- `npm run ci` ✅ lint + type-check + 11 testów web.
- `pytest tests -q` ✅ 6 testów API.
- Vercel build i deploy ✅.
- MIDI export generuje plik `.mid` w browserze ✅.

## Krytyka ROI

### Najwyższy ROI: TAK

- **Pivot na local-first** — eliminuje całą klasę problemów (credentials, hosting, koszty) w MVP. Użytkownik może od razu pracować lokalnie.
- **localStorage persistencja** — minimalny koszt, maksymalny wzrost użyteczności. Bez tego DAW był nieużywalny.
- **Browser MIDI export** — jedna funkcja mniej zależna od backendu. Szybsza i prostsza.

### Średni ROI: DO ZASTANOWIENIA

- **Electron dev-only wrapper** — działa tylko w dev mode (`npm run electron:dev`). Build produkcyjny Electrona wymaga dopracowania (`electron:build` + `electron-builder` + static export Next.js). Dla MVP wystarcza, ale prawdziwy desktop build to kolejna faza.
- **localStorage ograniczenia** — limit ~5MB, brak sync między urządzeniami, brak wersjonowania. Dla pełnego produktu trzeba SQLite/IndexedDB lub backend.

### Niski ROI / strata czasu

- **Próby deployu zewnętrznego backendu** — Render/AWS okazały się niemożliwe bez credentials. Dobrze, że szybko przeszliśmy na local-first zamiast marnować czas.

## Rekomendacje przed Phase 4

1. **Prawdziwy desktop build**
   - Dokończyć `electron:build` z `electron-builder`.
   - Skonfigurować Next.js static export (`output: 'export'`) dla buildu Electron.
   - Podpisać aplikację dla macOS (notary) i Windows (certyfikat).

2. **Lepsza lokalna baza danych**
   - Zamienić `localStorage` na IndexedDB + Dexie.js lub SQLite przez `better-sqlite3` w Electron.
   - Dodać wersjonowanie projektów i backup.

3. **Offline generation**
   - Obecnie generacja MIDI odbywa się przez Next.js API routes. Dla pełnego offline przenieść generator do frontendu (TypeScript) lub do Electron main process z Pythonem.

4. **Lepszy dźwięk**
   - SoundFonty są OK, ale prawdziwe sample packi (808/909, analog synths) podniosą jakość.
   - Dodać master EQ i limiter.

5. **UX/usprawnienia**
   - Zoom i scroll w timeline/piano roll.
   - Drag & drop regionów.
   - Metronom.

## Decyzje do podjęcia

- **Desktop stack:** Electron (prostszy dla web dev) vs Tauri (mniejszy, szybszy, Rust).
- **Lokalna baza:** IndexedDB (szybciej) vs SQLite (bardziej niezawodnie, ale tylko Electron).
- **Offline generation:** przenieść do TS (dużo pracy) czy uruchamiać Python lokalnie w Electron (większy rozmiar app).

## Go / No-Go

**GO** dla Phase 4 — local-first MVP działa. Następny krok to dopracowanie desktop buildu i lepszej lokalnej persistencji.
