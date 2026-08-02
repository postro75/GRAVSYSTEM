# GRAVSYSTEM — Next Steps

> Aktualny plan wynika bezpośrednio z `docs/Roadmap.md`. Szczegóły każdej fazy są tam opisane.

## Aktualna faza: Phase 0 — Foundation

1. **Monorepo i CI/CD**
   - Ustalić strukturę repo (`apps/web`, `apps/api`, `packages/core`, `packages/audio`).
   - Skonfigurować GitHub Actions: lint, type-check, unit tests.
   - Przygotować `docker-compose.yml` (Postgres, Redis).

2. **Data model i API scaffold**
   - Zdefiniować schemy `Project`, `Track`, `Region`, `MidiEvent`, `Effect` (Zod + Pydantic).
   - Postawić FastAPI z endpointami health-check.

3. **Frontend scaffold**
   - Next.js + Tailwind + shadcn/ui.
   - Podstawowy layout DAW (prompt bar, timeline, transport).

## Następna faza: Phase 1 — Text-to-MIDI Core

4. **Prompt parser + symbolic composer**
   - Grok / Kimi K2.7 zwraca strukturalny JSON aranżacji.
   - Generowanie MIDI dla perkusji, basu, akordów, leadu.

5. **Browser preview i render**
   - Tone.js dla natychmiastowego preview.
   - DawDreamer / Stable Audio dla renderu audio.

6. **Eksport MIDI**
   - Pobieranie `.mid` z wygenerowanego projektu.

## Dalsze fazy (szczegóły w Roadmap)

- Phase 2 — Browser DAW UI (sequencer, piano roll, mixer).
- Phase 3 — AI Co-Producer (regenerate, extend, stem separation, mastering).
- Phase 4 — Multi-DAW Export (REAPER, Ableton, Logic, FL, Studio One).
- Phase 5 — API & Developer Platform.
- Phase 6 — Collaboration & Social.
- Phase 7 — Polish & Scale.

## Decyzje do podjęcia

- Czy GRAVSYSTEM ma być open-source czy komercyjny? (wpływa na wybór GPL vs MIT pluginów)
- Czy finalny audio ma być generowany w przeglądarce czy na backendzie?
- Jaki budżet miesięczny na API Stable Audio / Grok / Kimi?
