# GRAVSYSTEM — Next Steps

## Priorytet wysoki

1. **Sample-based preview**
   - Zastąpić syntezatory Tone.js samplerami (kick, snare, hihat, clap) — natychmiastowy wzrost realizmu.

2. **Eksport Ableton Live `.als`**
   - Największy wzrost użyteczności po REAPER.
   - Format: gzipowany XML z trackami i clipami MIDI.

3. **LLM do aranżacji**
   - Grok/Claude zwraca JSON z pełną strukturą utworu (intro, verse, chorus, bridge, outro).
   - Funkcje/function calling zamiast czystego promptu.

## Priorytet średni

4. **Więcej stylów i struktur**
   - house, trance, trap, lo-fi, orchestral.
   - Perkusja, bas i lead dopasowane do każdego stylu.

5. **Backend render VST (DawDreamer)**
   - Docker z Pythonem + DawDreamer + Surge XT / Sfizz.
   - Finalny render offline z profesjonalnymi pluginami.
   - Uwaga na licencje GPL.

6. **VST companion plugin**
   - Plugin łączący aplikację webową z DAW.
   - Prototyp: VST3/CLAP w C++ z libcurl.

## Priorytet niski / eksperymentalne

7. **OSC bridge** do sterowania DAW w czasie rzeczywistym.
8. **Auto-mastering** przez Pedalboard lub API (Landr).
9. **Marketplace presetów użytkowników**.
10. **Integracja z AIMLAPI / ElevenLabs Music** jako alternatywa dla Stable Audio.

## Decyzje do podjęcia

- Czy GRAVSYSTEM ma być open-source czy komercyjny? (wpływa na wybór GPL vs MIT pluginów)
- Czy finalny audio ma być generowany w przeglądarce czy na backendzie?
- Jaki budzet miesięczny na API Stable Audio?
