# GRAVSYSTEM — Backend Consolidation Plan

## Decision

Consolidate all backend services into a **single FastAPI (Python) application** hosted inside `apps/api`. The Next.js frontend (`apps/web`) remains a pure client that calls the FastAPI backend.

## Why FastAPI only

| Criterion | FastAPI | Next.js API routes + Node microservices |
|---|---|---|
| AI / MIDI / audio libraries | Native access to `music21`, `mido`, `DawDreamer`, `Pedalboard`, `librosa`, `symusic` | Requires Python workers anyway |
| Single source of truth for schemas | Pydantic models shared with `packages/core/py` | Duplicated Zod + Pydantic validation |
| Deployment surface | One Docker image, one process | Multiple runtimes to coordinate |
| Team velocity | Python-first stack for music generation | Context switching between JS and Python |
| Async jobs | Celery / RQ / arq integrate cleanly | BullMQ is good but adds another runtime |
| Performance for CPU-heavy tasks | Easy to scale Python workers independently | Node is not ideal for DSP |

## Target architecture

```
┌─────────────────┐      ┌─────────────────────────────────────┐
│  Next.js (web)  │◀────▶│  FastAPI API (apps/api)             │
│  Static/Vercel  │      │  - /api/generate                    │
│                 │      │  - /api/render                      │
└─────────────────┘      │  - /api/export                      │
                         │  - /api/projects                    │
                         │  - /health                          │
                         └─────────────────────────────────────┘
                                          │
            ┌─────────────┬───────────────┼───────────────┐
            ▼             ▼               ▼               ▼
      PostgreSQL      Redis queue      R2/S3 Blob     Celery workers
      (projects)      (jobs)           (renders)      (CPU/GPU tasks)
```

## Deployment options

### Recommended: Render

- Native Docker support from `apps/api/Dockerfile`.
- Managed PostgreSQL and Redis.
- Auto-deploy from GitHub.
- Generous free tier for prototypes; paid plan for workers.

```yaml
# render.yaml (suggested)
services:
  - type: web
    name: gravsystem-api
    runtime: docker
    repo: https://github.com/postro75/GRAVSYSTEM
    dockerfilePath: apps/api/Dockerfile
    rootDir: apps/api
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: gravsystem-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: gravsystem-redis
          property: connectionString
      - key: GROK_API_KEY
        sync: false
      - key: R2_BUCKET_URL
        sync: false

  - type: worker
    name: gravsystem-worker
    runtime: docker
    repo: https://github.com/postro75/GRAVSYSTEM
    dockerfilePath: apps/api/Dockerfile
    rootDir: apps/api
    dockerCommand: celery -A tasks worker -l info
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: gravsystem-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: gravsystem-redis
          property: connectionString

databases:
  - name: gravsystem-db
    databaseName: gravsystem
    user: gravsystem

redis:
  - name: gravsystem-redis
    plan: standard
```

### Alternative: Railway

- Similar managed Postgres/Redis.
- Slightly simpler per-service deployment.
- Good if we want to colocate worker and web service initially.

### Alternative: Fly.io

- Great for edge placement.
- Requires more manual wiring for persistent volumes and Postgres.
- Better later when we need multi-region low-latency preview.

## Migration path

### Phase A — API parity (this week)

1. Move `/api/generate` logic from `apps/web/app/api/generate/route.ts` entirely to FastAPI `/api/generate`.
2. Update frontend to call `process.env.NEXT_PUBLIC_API_URL/api/generate`.
3. Add CORS middleware in FastAPI for Vercel preview + production domains.
4. Remove redundant Next.js API routes after verification.

### Phase B — Persistence (next sprint)

1. Add SQLModel / SQLAlchemy + Alembic in `apps/api`.
2. Create `Project`, `Track`, `Region`, `User` tables.
3. Implement CRUD endpoints under `/api/projects`.
4. Store project JSON blobs in Postgres for fast reads; audio renders in R2.

### Phase C — Async workers (following sprint)

1. Add Celery with Redis broker.
2. Move `/api/render` and `/api/export` to background tasks.
3. Expose job status endpoint `/api/jobs/{job_id}`.
4. Add retry logic and dead-letter queue.

## Required environment variables

```bash
# FastAPI
DATABASE_URL=postgresql://user:pass@host/gravsystem
REDIS_URL=redis://host:6379/0
API_SECRET_KEY=...
CORS_ORIGINS=https://vercel-app-pink-xi.vercel.app,http://localhost:3000

# AI providers
GROK_API_KEY=sk-...
KIMI_API_KEY=...

# Object storage (Cloudflare R2 / S3)
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=gravsystem-renders
```

## Dockerfile sketch

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Local development after consolidation

```bash
# Terminal 1 — FastAPI backend
cd apps/api
uvicorn main:app --reload --port 8000

# Terminal 2 — Next.js frontend
cd apps/web
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

## Monitoring & observability

- Health endpoint: `/health` (already implemented).
- Structured logging with `structlog`.
- OpenTelemetry + Sentry for errors and traces.
- Render/Railway built-in metrics for CPU/memory.

## Decision summary

- **Primary backend:** FastAPI in `apps/api`.
- **Primary host:** Render (web + worker + Postgres + Redis).
- **Frontend:** Next.js on Vercel, calling FastAPI via `NEXT_PUBLIC_API_URL`.
- **First deliverable:** Full API parity with CORS, then remove duplicate Next.js routes.
