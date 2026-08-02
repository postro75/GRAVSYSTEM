# GRAVSYSTEM — Benchmark and Gap Analysis

## Metodologia

Porównaliśmy GRAVSYSTEM z czterema kategoriami produktów:
1. Generatory muzyki AI (text-to-song)
2. Online DAW / współpraca w chmurze
3. Profesjonalne DAW z funkcjami AI
4. Narzędzia AI audio (stemy, mastering, edycja)

Każdy produkt oceniono pod kątem: generowania, edycji, eksportu, API, współpracy, ceny.

---

## 1. AI Music Generation Platforms

| Produkt | Generowanie | Edycja | Eksport | API | Cena wejścia | Ocena |
|---|---|---|---|---|---|---|
| **Suno** | Pełne piosenki z wokalem, ~1 min | Suno Studio: podstawowy DAW, 12 stemów | WAV, MIDI, stems | Brak publicznego | $8/mo Pro | ⭐⭐⭐⭐⭐ |
| **Udio** | Pełne piosenki, wysoka jakość | Ograniczona edycja, streaming-only | Brak downloadów | Brak | Subskrypcja | ⭐⭐⭐⭐ |
| **AIVA** | Instrumentalne, klasyczne/cinematic | Edytor MIDI, progresje | MIDI, WAV, MP3 | Enterprise only | €11/mo | ⭐⭐⭐⭐ |
| **Soundraw** | Instrumentalne loop-based | Dostosowanie długości/intensywności | MP3/WAV | Tak ($30/mo) | $0 / $30 API | ⭐⭐⭐⭐ |
| **Boomy** | Pop/EDM/lo-fi gotowe utwory | Podstawowa edycja | WAV, MP3, MIDI | Sales-gated | Free/$9.99 | ⭐⭐⭐ |
| **Mubert** | Generatywne streamy | Stylowe parametry | MP3 | Tak ($199/mo) | Free/$14/mo | ⭐⭐⭐ |
| **Loudly** | Soundtrack, stem separation | Edycja struktury | WAV/MP3 | Quote-based | Free/$9.99 | ⭐⭐⭐ |
| **Stable Audio** | Instrumentalne do 6 min | Brak edycji (tylko generacja) | WAV/MP3 | Tak | Pay-as-you-go | ⭐⭐⭐⭐ |
| **ElevenLabs Music** | Pełne piosenki z wokalem | Brak | MP3/WAV | Tak | $0.15/min | ⭐⭐⭐⭐⭐ |
| **Google Lyria 3 Pro** | Wokalne/instrumentalne | Brak | MP3/WAV | Tak (Vertex) | ~$0.08/track | ⭐⭐⭐⭐ |

### Wnioski

- **Suno** i **ElevenLabs Music** dominują w jakości pełnych piosenek.
- Żaden z nich nie daje pełnej kontroli DAW — są „black box".
- **AIVA** i **Soundraw** są najlepsze dla twórców chcących MIDI/kontroli.
- API są albo drogie, albo niedostępne (Suno, Udio).

---

## 2. Online DAWs / Cloud Collaboration

| Produkt | Sekwencer | Współpraca | AI features | Eksport | Cena | Ocena |
|---|---|---|---|---|---|---|
| **BandLab** | Pełny DAW online | Real-time collaboration | Mastering AI, generowanie dźwięków | MP3/WAV/MIDI | Free | ⭐⭐⭐⭐ |
| **Soundtrap** | Online DAW | Collaboration | Loops, some AI | WAV/MIDI | $7.99/mo | ⭐⭐⭐⭐ |
| **Amped Studio** | Online DAW | Cloud projects | AI assistant (Amped AI) | WAV/MIDI | Free/$6.95 | ⭐⭐⭐ |
| **Soundation** | Online DAW | Collaboration | Loop library | WAV | Free/$9.99 | ⭐⭐⭐ |
| **Ohm Studio** | Online DAW | Real-time collaboration | Brak | WAV | Free/$9/mo | ⭐⭐ |

### Wnioski

- BandLab jest najbliższy temu, czym GRAVSYSTEM chce być: darmowy, społecznościowy, z AI masteringiem.
- Brakuje w nich zaawansowanego generowania muzyki z opisu (text-to-DAW).
- Ich model biznesowy opiera się na społeczności/loops, nie na generatywnej AI.

---

## 3. Professional DAWs with AI

| DAW | AI features | Mocne strony | Słabe strony |
|---|---|---|---|
| **Ableton Live 12** | Roost AI drum fills, MIDI generation, audio-to-MIDI | Najlepszy do live/elektronicznej | Drogi, stromy learning curve |
| **Logic Pro** | Session Players (AI band), Stem Splitter, ChromaGlow | Kompletny, Apple ecosystem | Tylko macOS, zamknięty |
| **FL Studio** | AI mastering, pattern generation | Popularny w EDM/hip-hop | Chaotyczny workflow |
| **Studio One** | AI chord track, lyrics, arrangement | Profesjonalny mixing | Mniejszy ekosystem |
| **Pro Tools** | AI stem separation (Separation) | Industry standard audio | Bardzo drogi, archaiczny UI |
| **Cubase** | AI chord assistant, scale assistant | Zaawansowana edycja MIDI | Skomplikowany |

### Wnioski

- Profesjonalne DAW wprowadzają AI jako **asystent**, nie jako główny motor tworzenia.
- Żaden nie pozwala wygenerować pełnego projektu z jednego opisu.
- Są ciężkie, drogie, wymagają instalacji.

---

## 4. AI Audio Tools

| Kategoria | Produkt | Co robi | API | Cena |
|---|---|---|---|---|
| **Stem separation** | Moises | Rozdziela utwór na wokale, bębny, bas | Tak | Free/$6.99 |
| **Stem separation** | LALAL.ai | Wysokiej jakości stem separation | Tak | od $15 pakiet |
| **Mastering** | LANDR | Auto-mastering | Tak | od $5/mo |
| **Mastering** | CloudBounce | Auto-mastering | Tak | od $10/mo |
| **Mastering** | iZotope Ozone | Profesjonalny AI mastering | Brak | $199+ |
| **Audio editing** | Descript | Text-based audio/video editing | Tak | Free/$12/mo |
| **Voice AI** | ElevenLabs | Synteza głosu, śpiewu | Tak | od $5/mo |

### Wnioski

- Stem separation i mastering są już commodity — łatwo zintegrować.
- ElevenLabs to lider w syntezie głosu/wokalu.

---

## GRAVSYSTEM — aktualna pozycja

### Co mamy

✅ Generowanie MIDI/REAPER z opisu  
✅ 5 stylistycznych presetów  
✅ Browser preview (Tone.js)  
✅ Pro render (Stable Audio API)  
✅ Eksport .mid + .rpp  

### Czego brakuje vs konkurencja

❌ **Edycja w przeglądarce** — BandLab/Soundtrap mają pełny sequencer  
❌ **Generowanie pełnych piosenek z wokalem** — Suno/ElevenLabs dominują  
❌ **Współpraca real-time** — BandLab/Soundtrap  
❌ **Mastering AI** — LANDR/CloudBounce  
❌ **Stem separation** — Moises/LALAL.ai  
❌ **Sample library / loops** — Soundtrap/BandLab  
❌ **Social / marketplace** — BandLab community  
❌ **Eksport Ableton/Logic/FL** — tylko REAPER  
❌ **Mikser z automatyką** — brak  
❌ **Piano roll / edytor MIDI** — brak  

---

## Szansa rynkowa

Największa luka to połączenie:
- **Suno-like generowanie** z opisu,
- **BandLab-like edycji** w przeglądarce,
- **DAW-like kontroli** nad ścieżkami, MIDI, automatyką,
- **API-first podejścia** dla developerów i produktów.

GRAVSYSTEM powinien stać się **„AI DAW in the browser"** — nie tylko generator, ale pełne środowisko produkcji muzycznej sterowane głosem/tekstem.

---

## Kluczowe różnicowanie

1. **Text-to-DAW** — z opisu powstaje pełny projekt z trackami, regionami, automatyką.
2. **Hybrid AI + Control** — AI generuje, użytkownik edytuje wszystko w UI.
3. **Browser-first** — żadnej instalacji, współdzielenie linkiem.
4. **Multi-DAW export** — REAPER, Ableton, Logic, FL, Studio One.
5. **Developer API** — każda funkcja dostępna przez REST API.
