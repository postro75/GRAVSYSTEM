# GarageBand Arranger — Vercel App

Apple-style professional dashboard for generating music projects from natural language descriptions. Deployed on Vercel.

## Live URL

https://vercel-app-pink-xi.vercel.app

Latest production deployment: https://vercel-kj6szqmlz-pawes-projects-6903ff8e.vercel.app

## Features

- **Quick style presets** — Jarre Oxygène, Kavinsky Drive, Guetta Dance, Ambient Space, Techno Club
- **Natural language input** — describe your track in Polish or English
- **REAPER project export** — generates `.rpp` files
- **MIDI export** — generates `.mid` files
- **Waveform visualization** — canvas-based waveform preview
- **Audio preview** — synthesizes a simple WAV preview from the generated config
- **Apple-style UI** — clean, professional dashboard with Tailwind CSS

## Tech stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Vitest + jsdom for tests

## API routes

- `POST /api/generate` — generate a project or MIDI file
- `POST /api/waveform` — generate a WAV preview waveform

## Local development

```bash
cd /Users/pawelostrowski/garageband-arranger/vercel-app
npm install
npm run dev
```

Open http://localhost:3000

## Tests

```bash
npm test
```

## Deploy

```bash
vercel --prod --scope=pawes-projects-6903ff8e
```
