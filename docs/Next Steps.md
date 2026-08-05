> Next steps are driven by `docs/Roadmap.md` and `docs/Phase 15 ROI Critique.md`.

## Current focus: Phase 16 — Pro sound and backend render

Phase 15 is shipped. The highest-ROI next moves are:

### Highest priority

1. **Side-chain kick ducking**
   - The audio engine already has `sidechainGains` per track. Wire the kick pattern to duck pads/bass in dance/synthwave styles for the club pumping feel.

2. **First real WAM plugin**
   - Integrate a browser plugin (Dexed FM, OB-Xd, or Vital web build) behind a feature flag.
   - Load it as an AudioWorklet and route MIDI/audio through the existing track channel.

3. **Backend high-quality render**
   - Add a DawDreamer/Carla-based render pipeline (local or server) for offline WAV export with real VST instruments.

### Medium priority

4. **Phrase memory for leads/arps**
   - Replace pure random walks with short memorable motifs that repeat and vary, like real hooks.

5. **Per-track EQ and style-aware insert FX defaults**
   - Give each track a sensible starting EQ/compression shape based on its category and style.

6. **Better sample content**
   - Move beyond FluidR3_GM to higher-quality SFZ/SoundFont libraries or recorded one-shots.

### Decisions to make

- WAM integration depth: one demo plugin vs full rack.
- Backend render hosting: local Python service vs Vercel function vs dedicated server.
- Budget for external APIs (Stable Audio, Grok, Kimi) and sample content licensing.
