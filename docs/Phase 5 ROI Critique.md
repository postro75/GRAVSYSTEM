> Poprzednia faza: [[Phase 4 ROI Critique]]

# GRAVSYSTEM — Phase 5 ROI Critique (Muzyka + DAW UX)

## Co zostało dostarczone

1. **Lepsza dynamika i aranżacja generatora**
   - Sekcje aranżacyjne: `intro`, `build`, `drop`, `break`, `outro` zamiast pętli o stałej gęstości.
   - Domyślny układ sekcji dostosowany do długości utworu i stylu (16/24/32 bar).
   - Humanizacja velocity (+/- 15%) i micro-timing (+/- 5% ticka) z seeded RNG.
   - Różne gęstości elementów per sekcja — np. perkusja wyciszona w intro/break, pełna w drop.
   - Pliki: `lib/music-theory.ts`, `lib/pattern-generator.ts`.

2. **Mixer DAW**
   - Nowy komponent `components/daw/Mixer.tsx` z suwakami volume, pan oraz przyciskami mute/solo per track.
   - `AudioEngine` tworzy `Tone.Gain` + `Tone.Panner` per track i aplikuje zmiany w czasie rzeczywistym.
   - Solo/mute z logiką "jeśli cokolwiek solo, wycisz resztę".
   - Ustawienia mixera zapisywane w `Project.tracks` i persistowane w IndexedDB.

3. **Zoom i scroll timeline**
   - Kontrolki zoom +/- w toolbarze `Timeline`.
   - Zakres beatWidth 20–120 px.
   - Playback cursor skaluje się wraz z zoomem.

4. **Drag & drop regionów**
   - Przesuwanie regionu wzdłuż timeline (zmiana `startBeat`).
   - Zmiana długości regionu przez drag prawego brzegu.
   - Aktualizacja projektu i AudioEngine dopiero po zakończeniu drag (pointerup).

5. **REAPER project export (.rpp)**
   - Nowy moduł `lib/rpp-export.ts` generuje `.rpp` z embedded MIDI events.
   - Eksport oparty na nowym formacie `Project` z `@gravsystem/core`.
   - Przycisk "Export REAPER" w UI.

6. **Testy**
   - Testy sekcji aranżacyjnych i humanizacji w `__tests__/generator.test.ts`.
   - Testy `lib/rpp-export.ts` — nagłówek, tracki, note on/off.
   - Razem 17 testów web.

7. **CI, deploy, dokumentacja**
   - `npm run ci` ✅, `pytest` ✅.
   - Vercel production deploy: https://vercel-app-pink-xi.vercel.app
   - `docs/Phase 5 ROI Critique.md` utworzony i zsynchronizowany z Obsidian.

## Weryfikacja

- `npm run ci` ✅ lint + type-check + 17 testów web.
- `pytest tests -q` ✅ 6 testów API.
- Vercel build i deploy ✅.
- Generator produkuje sekcje intro/build/drop/break ✅.
- Mixer reaguje w czasie rzeczywistym ✅.
- Timeline zoom i drag działają ✅.
- Eksport .rpp zawiera poprawne MIDI events ✅.

## Krytyka ROI

### Najwyższy ROI: TAK

- **Sekcje aranżacyjne** — największy jednorazowy skok jakości muzyki. Utwór przestaje być pętlą, zaczyna brzmieć jak kompozycja.
- **Humanizacja** — tani sposób na mniej mechaniczne, bardziej "ludzkie" brzmienie.
- **Mixer** — podstawa DAW. Bez tego aplikacja była tylko odtwarzaczem generowanych patternów.
- **REAPER export** — natychmiastowa wartość dla producentów: mogą otworzyć projekt w profesjonalnym DAW i dalej pracować.

### Średni ROI: DO ZASTANOWIENIA

- **Drag & drop regionów** — działa, ale MVP: brak kopiowania między trackami, brak snap do siatki poza 1/4 beat, brak multi-select. Dla pełnego DAW potrzeba więcej.
- **Zoom timeline** — tylko poziomy. Brak zoomu pionowego i przewijania śledzącego cursor.
- **RPP embedded MIDI** — działa, ale duże projekty mogą generować bardzo duże pliki. W przyszłości można wygenerować osobny folder z `.mid` + `.rpp`.

### Niski ROI / strata czasu

- Brak. Wszystkie dodane funkcje bezpośrednio wspierają cel fazy.

## Rekomendacje przed Phase 6

1. **Lepszy dźwięk / sample packi**
   - Zamienić GM SoundFonty na własne one-shoty (808/909, analog synth waveforms).
   - Dodać ADSR, filter cutoff, envelope per instrument.

2. **Prawdziwy sampler i synteza**
   - Custom sampler z multisample'ami.
   - Proste oscylatory (saw, square, sine, noise) z filtrem dla basów i leadów.

3. **Pełniejszy DAW UX**
   - Piano roll: edycja velocity, długości nut, quantize.
   - Timeline: kopiowanie/usuwanie regionów, loop selection, metronom.
   - Arrangement view z markerami sekcji.

4. **Automatyzacja**
   - Rysowanie automation clipów (volume, filter, reverb send) w timeline.

5. **Audio export**
   - Render `.wav` offline przez `OfflineAudioContext`.
   - Eksport stems per track.

6. **Cloud opcjonalny**
   - Sync projektów między urządzeniami.
   - Generowanie audio AI (Stable Audio) jako płatny feature.

## Decyzje do podjęcia

- **Sampler:** własne sample packi vs kontynuacja SoundFont?
- **Synteza:** Web Audio API custom oscillators vs Tone.js instruments?
- **Cloud:** czy w Phase 6 dodawać backend do sync, czy skupić się na brzmieniu?

## Go / No-Go

**GO** dla Phase 6 — Phase 5 zamknęła core DAW UX i jakość generowanej muzyki. Następny krok to brzmienie (sample packi, synteza, audio export).
