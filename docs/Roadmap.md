# GRAVSYSTEM — Phased Build Roadmap

Each phase ends with: **internal review → user testing → bug fixes → GitHub commit → Obsidian notes update → go/no-go decision for next phase.**

---

## Phase 0 — Foundation (Weeks 1–2)

**Goal**: Solid project base, clear data model, and working CI/CD.

### Milestones
- [ ] Finalize monorepo structure (`apps/web`, `apps/api`, `packages/core`, `packages/audio`).
- [ ] Set up Next.js frontend scaffold with Tailwind + shadcn/ui.
- [ ] Set up FastAPI backend scaffold with health checks.
- [ ] Define `Project`, `Track`, `Region`, `MidiEvent`, `Effect` schemas (Zod + Pydantic).
- [ ] Configure GitHub Actions: lint, type-check, unit tests.
- [ ] Set up local dev environment with Docker Compose (Postgres, Redis).
- [ ] Create `README.md`, `CONTRIBUTING.md`, and architecture decision records (ADRs).

### Deliverables
- Running dev server for frontend and API.
- Passing CI pipeline.
- Merged `main` branch in `postro75/GRAVSYSTEM`.

### Success Criteria
- New developer can `git clone && docker compose up && npm run dev` within 10 minutes.

---

## Phase 1 — Text-to-MIDI Core (Weeks 3–5)

**Goal**: Reliable prompt-to-MIDI generation with style presets.

### Milestones
- [ ] Build prompt parser (LLM + deterministic post-processing).
- [ ] Implement symbolic composer for drums, bass, chords, lead.
- [ ] Create 5 initial style presets (Jarre ambient, Kavinsky synthwave, Guetta dance, cinematic, lo-fi).
- [ ] Generate normalized Project JSON from prompt.
- [ ] Browser preview using Tone.js (basic instruments + effects).
- [ ] Export to MIDI file.
- [ ] Render to audio using DawDreamer on the server.

### Deliverables
- `/api/generate` endpoint returns Project JSON.
- Frontend prompt bar + simple timeline + play button.
- MIDI download works.
- Rendered audio download works.

### Success Criteria
- 80% of prompts produce coherent 4-track projects in target style.
- Preview starts within 3 seconds on a fast connection.

---

## Phase 2 — Browser DAW UI (Weeks 6–9)

**Goal**: Usable in-browser editor.

### Milestones
- [ ] Multi-track sequencer timeline with zoom and snap.
- [ ] Piano roll editor for MIDI regions.
- [ ] Mixer panel with volume, pan, mute, solo, inserts.
- [ ] Basic effects: EQ, compressor, reverb, delay, filter.
- [ ] Automation lanes for parameters.
- [ ] Undo/redo and project version history.
- [ ] Save/load projects from cloud.

### Deliverables
- User can edit any generated project in the browser.
- Edits persist to backend.
- Undo/redo works across all operations.

### Success Criteria
- Users can create a complete 8-bar loop from scratch or from a prompt without leaving the browser.
- Lighthouse performance score ≥ 70.

---

## Phase 3 — AI Co-Producer (Weeks 10–13)

**Goal**: AI tools integrated into the DAW workflow.

### Milestones
- [ ] Regenerate selected track/region from prompt.
- [ ] Extend arrangement (add intro/verse/chorus).
- [ ] Generate variations of a region.
- [ ] Chord/melody suggestion panel.
- [ ] Stem separation integration (demucs/Spleeter).
- [ ] AI mastering assistant.

### Deliverables
- Contextual AI actions in the timeline and mixer.
- Stem separation uploads and creates new tracks.
- Mastering preview toggle (before/after).

### Success Criteria
- AI actions are invoked from right-click menus and toolbars.
- Mastered output passes basic loudness checks (-14 LUFS integrated ± 2).

---

## Phase 4 — Multi-DAW Export (Weeks 14–16)

**Goal**: Professional interoperability.

### Milestones
- [ ] REAPER (.rpp) export with regions and effects.
- [ ] Ableton Live (.als) export.
- [ ] Logic Pro export via MIDI + stems package.
- [ ] FL Studio (.flp) export.
- [ ] Studio One (.song) export.
- [ ] Batch export of stems + MIDI for any DAW.

### Deliverables
- Export menu with all supported formats.
- Valid project files open correctly in target DAWs.

### Success Criteria
- Exported project loads in target DAW without errors.
- Track names, MIDI notes, and tempo map are preserved.

---

## Phase 5 — API & Developer Platform (Weeks 17–19)

**Goal**: API-first product for external builders.

### Milestones
- [ ] REST API documentation (OpenAPI/Swagger).
- [ ] API key management and usage dashboards.
- [ ] Webhooks for async job completion.
- [ ] SDK / code examples (Python, JavaScript, cURL).
- [ ] Rate limiting and billing integration.

### Deliverables
- Public API with `/generate`, `/render`, `/export`, `/projects` endpoints.
- Developer portal with examples.

### Success Criteria
- External developer can generate and render a project using only API docs.
- 99.9% API uptime over 30 days.

---

## Phase 6 — Collaboration & Social (Weeks 20–24)

**Goal**: Team workflow and community.

### Milestones
- [ ] Real-time collaborative editing (operational transforms / CRDT).
- [ ] Shareable project links with permissions.
- [ ] Comments on timeline regions.
- [ ] Public project showcase / templates marketplace.
- [ ] Teams and workspaces with role-based access.

### Deliverables
- Two users can edit the same project simultaneously.
- Public templates are browsable and remixable.

### Success Criteria
- Concurrent editing latency < 200 ms for local users.
- Template marketplace has 50+ community presets.

---

## Phase 7 — Polish & Scale (Weeks 25–30)

**Goal**: Production-ready service and growth.

### Milestones
- [ ] Performance optimization (large projects, audio streaming).
- [ ] Mobile / tablet responsive DAW view.
- [ ] Advanced instruments and sample library integration.
- [ ] Custom model fine-tuning for paying users.
- [ ] Security audit and penetration testing.
- [ ] Launch marketing site and onboarding flow.

### Deliverables
- Public beta launch.
- Paid tiers active.
- Monitoring, alerting, and support channels.

### Success Criteria
- 1,000 active users in the first month of public beta.
- NPS ≥ 40 from paying users.

---

## Ongoing Cycles

After Phase 7, work continues in 2-week sprints focused on:
1. Quality improvements from user feedback.
2. New style presets and instrument packs.
3. API expansion.
4. Performance and reliability.

Each cycle ends with: review, tests, docs update, commit, Obsidian sync.
