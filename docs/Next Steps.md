> Aktualny plan wynika bezpośrednio z `docs/Roadmap.md` i `docs/Phase 0 ROI Critique.md`.

## Aktualna faza: Phase 1 — Text-to-MIDI Core

Phase 0 — Foundation ✅ zakończona. Szczegóły w `docs/Phase 0 ROI Critique.md`.

### Najwyższy priorytet (największy ROI)

1. **Prawdziwy text-to-MIDI w backendzie**
   - Przenieść logikę z `apps/web/lib/music.ts` + `apps/web/lib/midi.ts` do Pythona (lub wywołać przez API).
   - Endpoint `/api/generate` zwraca pełny Project JSON z MIDI events.
   - Frontend renderuje regiony na timeline.

2. **Sample-based preview**
   - Zastąpić syntezatory Tone.js samplerami (kick, snare, hihat, clap).
   - To największy wzrost realizmu przy niskim koszcie.

3. **Wyczyść warningi ESLint**
   - Usunąć unused variables w istniejącym kodzie.

### Średni priorytet

4. **API URL dla Vercel preview**
   - Ustawić `API_URL` env var lub proxy w Next.js API routes.

5. **Rozszerzyć testy API**
   - Testy dla generowania MIDI z opisu.

### Decyzje do podjęcia

- Open-source vs komercyjny.
- Browser vs backend render audio.
- Miesięczny budżet API (Stable Audio, Grok, Kimi).
