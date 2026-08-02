> Aktualny plan wynika bezpośrednio z `docs/Roadmap.md` i `docs/Phase 1 ROI Critique.md`.

## Aktualna faza: Phase 2 — Browser DAW UI

Phase 0 — Foundation ✅ i Phase 1 — Text-to-MIDI Core ✅ zakończone.

### Najwyższy priorytet (największy ROI)

1. **Piano roll / edytor MIDI**
   - Kliknięcie regionu otwiera edytor nut.
   - Możliwość dodawania, przesuwania, usuwania nut.

2. **Odtwarzanie z transportu**
   - Podłączyć Play/Pause/Stop do Tone.js.
   - Cursor na timeline pokazuje aktualną pozycję.

3. **Ujednolicenie backendu**
   - Wybrać: FastAPI (rekomendowane) lub Next.js functions.
   - Jeśli FastAPI — zdeployować na Render/Railway/Fly.

### Średni priorytet

4. **Lepsze sample'y**
   - Zamiana syntetycznych WAV na prawdziwe sample perkusji.

5. **Export MIDI z backendu**
   - `/api/generate` zwraca też plik `.mid`.

6. **Mixer podstawowy**
   - Volume/pan per track.

### Decyzje do podjęcia

- Stack generowania: FastAPI vs Next.js functions.
- Hostowanie FastAPI: Render/Railway/Fly.
- Open-source vs komercyjny.
- Budżet API (Stable Audio, Grok, Kimi).
