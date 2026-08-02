# GRAVSYSTEM — Plan rozwoju (v1)

## Obecny stan

Aplikacja Next.js na Vercel:
- UI z presetami stylistycznymi (Jarre, Kavinsky, Guetta, Ambient, Techno) ze zdjęciami i ikonami.
- Algorytmiczny generator MIDI/REAPER z opisu (BPM, tonacja, styl, akordy, aranżacja).
- Wbudowany prosty syntezator WAV preview (kick, snare, hihat, bass, pad, arpeggio, lead + reverb/delay).
- Eksport: `.mid` + `.rpp` (REAPER z osadzonymi MIDI).

## Problem strategiczny

Obecny silnik generuje MIDI/projekt, ale **nie generuje gotowego audio** w jakości „pro". Preview jest syntetyczny i nigdy nie dorówna Suno/Udio/Vital. Z drugiej strony — daje pełną kontrolę nad ścieżkami MIDI, czego Suno nie oferuje.

Cel: połączyć oba światy:
1. Zachować możliwość edycji MIDI/DAW (kontrola kompozytorska).
2. Dodać opcję generowania gotowego audio w wysokiej jakości.
3. Rozszerzyć integrację DAW poza REAPER (Ableton, Logic, Studio One, FL Studio).

---

## Rekomendowana architektura — hybrydowa

```
Opis użytkownika
      │
      ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│   Parser LLM    │────▶│  Music Engine   │────▶│  MIDI / DAW export  │
│ (Grok/Claude/4o)│     │ (reguły + AI)   │     │  (.mid, .rpp, .als) │
└─────────────────┘     └─────────────────┘     └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Render Pipeline    │
                    │ (DawDreamer / API)  │
                    └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  High-quality WAV   │
                    │  (Surge, Vital, AI) │
                    └─────────────────────┘
```

---

## Opcje generowania audio

### Opcja A: API zewnętrzne (szybkie, najlepsza jakość)

| Narzędzie | API | Cena | Vocals | Uwagi |
|---|---|---|---|---|
| **Stable Audio 3.0** | Tak (REST) | ~$0.20–0.26/gen | Nie | Najlepszy instrumentalny audio, do 6 min, oficjalne licencje. |
| **ElevenLabs Music** | Tak (REST) | ~$0.15/min | Tak | Pełne piosenki, dobre SDK, nowy gracz. |
| **Google Lyria 3 Pro** | Tak (Gemini/Vertex) | ~$0.08/track | Tak | Wokal, SynthID watermark, do 3 min. |
| **Soundraw API** | Tak (REST) | $29.99/mo+ | Nie | Royalty-free instrumentalne, dobre dla content creatorów. |
| **MusicGen via Replicate** | Tak | ~$0.06/gen | Nie | Krótkie klipy, non-commercial weights, tanie eksperymenty. |

**Rekomendacja:** Stable Audio 3.0 jako pierwszy backend audio dla instrumentalnych generacji, ElevenLabs Music jako opcja z wokalem.

### Opcja B: Self-hosted render (kontrola, koszt przy skali)

| Narzędzie | Rola | Licencja | Uwagi |
|---|---|---|---|
| **DawDreamer** | Python DAW host (VST3/AU) | MIT | Render offline z MIDI + pluginy. |
| **Surge XT** | Synth hybrydowy | GPL-3 | OSC, CLI, ogromna biblioteka presetów. |
| **Vital** | Wavetable synth | GPL-3 | 200+ parametrów, Vita Python bindings. |
| **Dexed** | FM (DX7) | GPL-3 | Klasyczne brzmienia, SysEx. |
| **Sfizz** | SFZ sampler | BSD-2 | Otwarte sample libraries. |
| **Pedalboard** | Efekty VST3/AU | Apache-2 | Łatwa integracja Python. |

**Rekomendacja:** Backend render oparty na **DawDreamer + Surge XT + Sfizz + Pedalboard** zainstalowany na serwerze (możliwe na Vercel tylko jako Edge/Serverless — lepiej dedykowany Docker, np. Railway/Fly.io/Render).

### Opcja C: Browser-native preview (bez serwera)

| Narzędzie | Rola | Uwagi |
|---|---|---|
| **Tone.js** | Synteza + sekwencer | Już częściowo używane, można rozwinąć. |
| **Web Audio Modules (WAM)** | Standard pluginów webowych | Można wczytywać community pluginy (WebDX7, WebCZ101). |
| **Faust → WASM** | Custom DSP | AI może generować kod Fausta dla efektów/instrumentów. |
| **Cmajor** | Nowoczesny język DSP | Mniej dojrzały niż Faust. |

**Rekomendacja:** Tone.js/WAM jako warstwa preview w przeglądarce, ale finalny render przez backend (Opcja A lub B).

---

## Rozszerzenie eksportu DAW

| DAW | Format | Metoda | Trudność |
|---|---|---|---|
| **REAPER** | `.rpp` | Generowanie tekstowe (działa) | Niska |
| **Ableton Live** | `.als` | gzip XML, można generować offline | Niska–Średnia |
| **Logic Pro** | `.logicx` | Bundle + binarny ProjectData | Wysoka (reverse engineering) |
| **FL Studio** | `.flp` | Format binarny, API ograniczone | Wysoka |
| **Studio One** | `.song` | Niewspierany publicznie | Bardzo wysoka |

**Rekomendacja:** Dodać eksport **Ableton Live `.als`** jako drugi po REAPER (duża baza użytkowników, format dość dobrze poznany). Logic i FL Studio zostawić na później.

---

## Roadmap rozwoju

### Faza 1 — Solidne fundamenty (2–3 tyg.)

1. **Refaktoring Music Engine**
   - Rozdzielić parser opisu (LLM) od silnika kompozycyjnego.
   - Wprowadzić strukturę utworu: intro, verse, chorus, bridge, outro.
   - Dodać style: house, trance, lo-fi, orchestral, trap.
   - Lepsza generacja melodyjek (skale pentatoniczne, passing tones, groove).

2. **Lepszy preview**
   - Zamienić obecny syntezator na **Tone.js** w przeglądarce (Sampler + polifoniczne synthy).
   - Sample drumów (kick, snare, hihat) ładowane z CDN.
   - Prostszy, bardziej przewidywalny niż obecny custom synth.

3. **Stabilizacja**
   - Więcej testów dla MIDI/RPP/WAV.
   - Obsługa błędów i walidacja opisu.

### Faza 2 — Integracje audio AI (2–3 tyg.)

1. **Backend render (Opcja A: Stable Audio)**
   - Endpoint `/api/render-audio` wysyłający prompt do Stable Audio API.
   - Prompt engineering: z opisu generować prompt dla modelu audio.
   - Zwracanie WAV + metadata.

2. **Backend render (Opcja B: DawDreamer)**
   - Dockerfile z Pythonem + DawDreamer + Surge XT + Sfizz.
   - Endpoint przyjmujący config, renderujący WAV z MIDI + pluginy.
   - Cache wyników (Redis/Vercel KV).

3. **Wybór przez użytkownika**
   - „Fast preview" (Tone.js)
   - „Pro render" (backend)
   - „AI audio" (Stable Audio / ElevenLabs)

### Faza 3 — Eksport DAW i współpraca (2–3 tyg.)

1. **Eksport Ableton `.als`**
   - Generowanie gzipowanego XML z trackami, clipami MIDI, automatyką.
   - Presety instrumentów (np. wavetable, operator).

2. **VST/AU companion plugin**
   - Plugin łączący się z aplikacją webową, wczytujący wygenerowane MIDI bezpośrednio do DAW.
   - Prototyp: VST3/CLAP w C++ z libcurl + JSON.

3. **OSC bridge**
   - Lokalny bridge (Node.js/Electron) pozwalający sterować DAW z aplikacji webowej.

### Faza 4 — AI i automatyzacja (3–4 tyg.)

1. **LLM do aranżacji**
   - Grok/Claude generuje JSON z kompletną strukturą utworu (akordy, melodia, perkusja, automatyka).
   - Funkcje/fine-tuning do formatu MusicConfig.

2. **Auto-mastering**
   - Integracja z **Landr API**, **CloudBounce**, lub własnym chainem Pedalboard.

3. **Społeczność / marketplace**
   - Presety użytkowników, sharing projektów.

---

## Rekomendacje techniczne

### Stack docelowy

- **Frontend:** Next.js 16, React 19, Tailwind, Tone.js, WAM SDK.
- **Backend Vercel:** API routes dla generowania MIDI/RPP/ALS, proxy do Stable Audio.
- **Backend render:** Docker (Python) z DawDreamer + Surge/Sfizz/Pedalboard (Railway/Render/Fly).
- **Baza:** PostgreSQL (presety, projekty) + Redis/Vercel KV (cache renderów).
- **Storage:** Vercel Blob / Cloudflare R2 dla WAV i projektów.
- **LLM:** Grok (via xAI API) lub Claude 3.5 Sonnet do parsowania opisów.

### Integracja LLM

Zamiast reguł powinien być pipeline:

```
Opis użytkownika
    │
    ▼
LLM wyodrębnia:
  - styl, BPM, tonacja, skala
  - strukturę (intro/verse/chorus)
  - progresję akordów
  - aranżację ścieżek
  - nastrój / instrumentację
    │
    ▼
Music Engine waliduje i kompletuje braki
    │
    ▼
MIDI / RPP / ALS / WAV
```

Funkcje LLM powinny zwracać struktury JSON (function calling), nie tekst.

### Licencje — pułapki

- **Surge XT, Vital, Helm, Dexed** — GPL-3. Jeśli hostujesz je na backendzie i generujesz audio dla użytkowników, może to wymagać open-sourcingu części backendu. Lepiej użyć **Stable Audio API** lub instrumentów z łagodniejszymi licencjami.
- **Tone.js, Pedalboard, DawDreamer** — przyjazne licencje (MIT/Apache).

---

## Co zrobić w następnym kroku

1. **Dodać Tone.js do preview** — natychmiast poprawi jakość dźwięku w przeglądarce.
2. **Dodać eksport Ableton `.als`** — największy wzrost użyteczności po REAPER.
3. **Zintegrować Stable Audio API** — pierwsza prawdziwa „pro audio" funkcja.
4. **Rozdzielić parser opisu na LLM** — Grok/Claude zwracający JSON z aranżacją.

---

## Ryzyka

- **Suno/Udio** nie mają publicznych API — nie budować na nich kluczowych funkcji.
- **GPL pluginy** w backendzie mogą wymusić open-source — skonsultować licencję przed hostingiem.
- **Generowanie audio AI** może mieć wysokie koszty — wprowadzić limity i cache.
- **DAW formats** — Logic/FL są zamknięte, REAPER/Ableton to najlepszy ROI.
