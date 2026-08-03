> Poprzednia faza: [[Phase 3b ROI Critique]]

# GRAVSYSTEM — Phase 4 ROI Critique (Production desktop build + offline generation)

## Co zostało dostarczone

1. **Offline MIDI generation w TypeScript** — cała generacja przeniesiona z Next.js API routes / FastAPI do frontendu:
   - `lib/music-theory.ts` — skale, akordy, progresje, detekcja stylu/BPM/tonacji z opisu.
   - `lib/pattern-generator.ts` — deterministyczne patterny perkusji, basu, arpeggio, akordów, leadu, FX.
   - `lib/generator.ts` — `generateProject(request)` zwraca gotowy `Project` z `@gravsystem/core`.
   - `app/page.tsx` generuje teraz lokalnie przez `generateProject`, bez fetch do `/api/generate`.
2. **IndexedDB persistence** — Dexie.js w `lib/db.ts` zastępuje `localStorage`:
   - Projekty zapisywane w IndexedDB, auto-load ostatniego projektu.
   - Import / export całej kolekcji projektów do JSON z UI (`Export JSON` / `Import JSON`).
   - Brak limitu ~5MB localStorage, działa offline.
3. **Produkcyjny build Electrona** — `npm run electron:build` generuje paczkowane aplikacje:
   - `next.config.js` z `output: 'export'` pod Electron i `standalone` pod Vercel.
   - `electron-builder` skonfigurowany w `apps/web/package.json`.
   - Wyjście: `release/GRAVSYSTEM-1.0.0.dmg` (x64) i `release/GRAVSYSTEM-1.0.0-arm64.dmg` (arm64) dla macOS.
4. **Lepszy master chain audio** — w `lib/audio-engine.ts`:
   - Chorus → Delay → Reverb → EQ3 → Compressor → Limiter (-0.5 dB).
   - EQ koryguje niskie i wysokie pasma; limiter zabezpiecza przed clippingiem.
5. **Czysty CI i testy** — `npm run ci` ✅, `pytest` ✅.
6. **Vercel production deploy** — https://vercel-app-pink-xi.vercel.app działa bez backendu.
7. **Usunięte martwe API routes** — `/api/generate` i `/api/waveform` usunięte wraz z zależnymi starymi modułami (`lib/music.ts`, `lib/midi.ts`, `lib/rpp.ts`, `lib/wav.ts`). Testy przepisane na nowy generator.

## Weryfikacja

- `npm run ci` ✅ lint + type-check + 10 testów web.
- `pytest tests -q` ✅ 6 testów API.
- `npm run electron:build` ✅ produkuje DMGi.
- Vercel build i deploy ✅.
- Offline generation w przeglądarce ✅ — `generateProject` tworzy `Project` bez sieci.
- IndexedDB import/export ✅.

## Krytyka ROI

### Najwyższy ROI: TAK

- **Offline generation** — eliminuje zależność od backendu i LLMów do generowania MIDI. Szybkość i niezawodność wzrosły drastycznie. To fundament local-first DAW.
- **IndexedDB** — rozwiązuje limit localStorage i daje prawdziwą lokalną bazę. Import/export JSON to tani sposób na backup/migrację.
- **Produkcyjny build Electrona** — MVP staje się realną desktopową aplikacją, nie tylko wrapperem dev.
- **Usunięcie martwego kodu** — mniej plików, mniej confusion, mniejsze ryzyko błędów.

### Średni ROI: DO ZASTANOWIENIA

- **DMG bez podpisu** — działa lokalnie, ale na macOS użytkownik zobaczy ostrzeżenie Gatekeeper. Do dystrybucji potrzebny Developer ID + notaryzacja.
- **Electron vs Tauri** — Electron działa, ale appka ma ~200 MB. Tauri dałoby <10 MB, ale wymagałoby Rust. Dla szybkości iteracji Electron OK.
- **Ręczny import/export JSON** — przydatny, ale prawdziwy backup/sync wymagałby chmury (opcjonalnie płatny feature) lub lokalnego folderu projektów.

### Niski ROI / strata czasu

- **Próby deployu ze starym backendem** — zostały porzucone wcześniej; dobrze, że nie wracaliśmy do nich. Obecny local-first kierunek jest właściwy.

## Rekomendacje przed Phase 5

1. **Własne sample packi**
   - SoundFonty `smplr` są OK, ale charakterystyczne brzmienia Jarre/Kavinsky wymagają dobrych one-shotów (kick 808/909, analog synth waveforms, strings).
   - Zamienić GM SoundFonty na sampler z własnymi multisample'ami lub połączyć z Web Audio API custom oscillators.

2. **Lepsza dynamika i aranżacja**
   - Automatyzacja parametrów (filter cutoff, reverb send, delay feedback) w czasie utworu.
   - Sekcje Intro / Break / Build / Drop zamiast pętli o stałej gęstości.
   - Humanizacja velocity i micro-timing.

3. **Prawdziwe DAW UX**
   - Zoom / scroll timeline.
   - Drag & drop regionów.
   - Edycja velocity w Piano Roll.
   - Mixer z volume/pan/solo/mute per track.

4. **Dystrybucja desktopowa**
   - Podpisać aplikację macOS (notaryzacja) i Windows (certyfikat kodu).
   - Auto-updater (electron-updater + GitHub releases).

5. **Integracje eksportowe**
   - REAPER project (.rpp) — przywrócić i uaktualnić do formatu opartego na nowym `Project`.
   - Audio render (.wav) offline w przeglądarce (OfflineAudioContext).
   - MIDI clock / sync z zewnętrznym sprzętem (Web MIDI).

6. **Model biznesowy / cloud opcjonalny**
   - Lokalne generowanie powinno być darmowe.
   - Płatne cloud features: generowanie audio AI (Stable Audio), sync projektów między urządzeniami, współpraca.

## Decyzje do podjęcia

- **Stack desktopowy:** zostawić Electron (szybszy rozwój) czy migrować do Tauri (mniejszy rozmiar, lepsza wydajność)?
- **Sampler:** rozbudować SoundFont/smplr czy przejść na custom Web Audio sampler?
- **Cloud:** czy w Phase 5 dodawać sync, czy skupić się na jakości dźwięku i UX?

## Go / No-Go

**GO** dla Phase 5 — Phase 4 zamknęła local-first MVP. Aplikacja działa offline, ma produkcyjny build desktopowy i persistencję. Następny krok to jakość brzmienia i pełniejszy UX DAW.
