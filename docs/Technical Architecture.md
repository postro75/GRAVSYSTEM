# GRAVSYSTEM — Technical Architecture

## Overview

GRAVSYSTEM is built as a modern web application split into three layers:
1. **Frontend** — browser DAW UI and playback engine.
2. **Backend** — API, job queue, project persistence, AI orchestration.
3. **Render / AI workers** — CPU/GPU-heavy tasks isolated for scale.

All layers communicate through typed APIs and event streams. The architecture is API-first so that every user-facing feature is also available to developers.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14+ (App Router), React, TypeScript | UI, routing, SSR |
| State | Zustand + TanStack Query | Client state and server cache |
| Styling | Tailwind CSS + shadcn/ui | Consistent, Apple-like design |
| Audio engine (browser) | Tone.js + Web Audio API | Real-time preview, synthesis, effects |
| Audio engine (server) | DawDreamer / Pedalboard / librosa | High-quality offline render |
| AI generation | xAI Grok API / Kimi K2.7 / local models via Ollama | Natural language understanding, symbolic music generation |
| MIDI / DAW export | custom Python generators + music21 | REAPER, Ableton, Logic, FL, Studio One |
| Backend framework | FastAPI (Python) + Node.js microservices | AI tasks in Python, real-time in Node |
| Queue | Redis + BullMQ / Celery | Async generation and render jobs |
| Database | PostgreSQL + Drizzle ORM | Users, projects, metadata |
| Object storage | Cloudflare R2 / Vercel Blob | Audio stems, renders, exports |
| Real-time | Socket.io / PartyKit | Collaboration and status streams |
| Hosting | Vercel (frontend), Cloudflare Workers / AWS (workers) | Edge + scalable compute |
| Auth | Clerk / NextAuth | User accounts, teams, API keys |

---

## System Components

### 1. Frontend — Browser DAW

```
┌─────────────────────────────────────────────┐
│  GRAVSYSTEM Web App (Next.js + React)        │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ Prompt Bar │ │  Timeline  │ │  Mixer   │ │
│  └────────────┘ └────────────┘ └──────────┘ │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ Transport  │ │ Piano Roll │ │ Inspector│ │
│  └────────────┘ └────────────┘ └──────────┘ │
└─────────────────────────────────────────────┘
              │
              ▼
      Tone.js + Web Audio
```

Responsibilities:
- Capture user prompts and project edits.
- Render the sequencer, piano roll, mixer, and automation lanes.
- Play back the project using Tone.js instruments and effects.
- Communicate with backend for generation, render, and export.

### 2. Backend API

```
┌─────────────────────────────────────────────┐
│  API Gateway (FastAPI + Node)                │
│  ┌─────────────┐ ┌──────────┐ ┌───────────┐ │
│  │ /generate   │ │ /render  │ │ /export   │ │
│  │ /projects   │ │ /stems   │ │ /master   │ │
│  └─────────────┘ └──────────┘ └───────────┘ │
└─────────────────────────────────────────────┘
```

Responsibilities:
- Authenticate users and validate requests.
- Dispatch generation/render/export jobs to workers.
- Store project state and metadata.
- Serve project assets (MIDI, audio, exports).
- Manage API keys and quotas.

### 3. AI Orchestration Worker

```
┌─────────────────────────────────────────────┐
│  Generation Worker (Python)                  │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Prompt parser│→ │ Symbolic composer    │ │
│  │ (LLM/regex)  │  │ (rules + LLM)        │ │
│  └──────────────┘  └──────────────────────┘ │
│  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Style engine │→ │ MIDI + arrangement   │ │
│  │ (presets)    │  │ data structure       │ │
│  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────┘
```

Responsibilities:
- Parse the prompt into structured musical intent.
- Generate MIDI data, chord progressions, and arrangement.
- Apply stylistic presets (Jean-Michel Jarre, Kavinsky, etc.).
- Return a normalized project JSON format.

### 4. Render Worker

```
┌─────────────────────────────────────────────┐
│  Render Worker (Python / DawDreamer)         │
│  ┌─────────────┐ ┌────────────┐ ┌─────────┐ │
│  │ Load MIDI   │ │ Synthesize │ │ Master  │ │
│  │ + project   │ │ + mix      │ │ + limit │ │
│  └─────────────┘ └────────────┘ └─────────┘ │
└─────────────────────────────────────────────┘
```

Responsibilities:
- Render project to WAV using VST instruments or sample libraries.
- Apply mix and automation.
- Run mastering chain.
- Upload final audio to object storage.

### 5. Export Worker

Responsibilities:
- Convert internal project JSON to DAW-specific formats.
- Package MIDI + stems + metadata.
- Produce .rpp, .als, .logicx, .flp, .song files.

---

## Data Model (Core)

### Project
- `id`, `ownerId`, `title`, `description`, `bpm`, `key`, `timeSignature`
- `tracks[]`, `regions[]`, `automation[]`, `mixSettings`
- `createdAt`, `updatedAt`, `version`

### Track
- `id`, `name`, `type` (midi/audio/group), `instrument`, `channel`
- `regions[]`, `volume`, `pan`, `mute`, `solo`, `effects[]`

### Region
- `id`, `trackId`, `startBeat`, `duration`, `type`
- `midiEvents[]` OR `audioUrl` + `transpose`, `gain`

### MidiEvent
- `pitch`, `velocity`, `start`, `duration`

### Effect
- `type` (eq, compressor, reverb, delay, filter, limiter)
- `parameters[]`

---

## Data Flow: Prompt to Render

```
User prompt
    │
    ▼
Frontend ──▶ /api/generate
    │
    ▼
Backend validates quota, enqueues job
    │
    ▼
AI Worker parses prompt + generates Project JSON
    │
    ▼
Backend stores Project JSON, returns projectId
    │
    ▼
Frontend loads Project JSON into browser DAW
    │
    ▼
Tone.js plays preview immediately
    │
    ▼
User edits / requests render
    │
    ▼
Render Worker produces mastered WAV
    │
    ▼
Asset stored + served via CDN
```

---

## Integrations

| Service | Role |
|---|---|
| xAI Grok API | Natural-language understanding, high-level arrangement decisions |
| Kimi K2.7 | Alternative / fallback LLM for generation and explanation |
| Stable Audio API | Audio generation / augmentation |
| ElevenLabs API | Vocals / voice synthesis (future) |
| Cloudflare R2 | Object storage for renders and exports |
| Vercel | Frontend hosting and serverless functions |
| Clerk | Authentication and teams |

---

## Security & Compliance

- All audio assets served via signed URLs.
- API keys scoped per project/workspace.
- Rate limiting per user and per API key.
- Input validation and sandboxed render workers.
- GDPR/CCPA-ready data deletion flows.

---

## Scalability Considerations

- Render workers are stateless and horizontally scalable.
- Job queue with priority lanes (preview, render, export).
- Frontend playback uses client CPU; heavy rendering is server-side.
- Asset storage separated from application database.
- Caching of generated MIDI patterns and style templates.
