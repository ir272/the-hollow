# THE HOLLOW

A first-person psychological horror exploration game built entirely in Three.js.

**Play in browser** — no downloads, no external assets, everything synthesized.

## Concept

You wake inside an abandoned gothic cathedral with no memory. Something ancient watches from the shadows. Find 4 ritual artifacts to unlock the exit — but your sanity is crumbling, and the line between reality and nightmare is dissolving.

**The Warden** stalks the halls. It cannot be killed. It can only be avoided.

## Tech Stack

- **Three.js** — all 3D rendering, geometry, lighting
- **Vite** — dev server + build
- **Web Audio API** — fully synthesized audio (no audio files)
- **Custom GLSL shaders** — post-processing, fog, distortion

## Features

- Dynamic candlelight with flickering shadows
- Sanity system that distorts visuals and audio as you lose grip
- Procedural audio: ambient drones, whispers, footsteps, heartbeat
- Atmospheric fog and volumetric light shafts
- Hand-built gothic cathedral + underground crypt
- 4 artifact puzzles with scripted horror sequences
- 10 lore notes revealing the cathedral's dark history
- The Warden: an unkillable stalker AI with detection cone

## Controls

- **WASD** — Move
- **Mouse** — Look
- **E** — Interact / Pick up
- **CTRL** — Crouch
- **ESC** — Pause

## Run Locally

```bash
npm install
npm run dev
```

## License

MIT
