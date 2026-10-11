# AGENTS.md

AI Dungeon: an Angular 18 SPA (`frontend/`) and a Cloudflare Worker API (`worker/`: Hono, D1, Workers KV, Workers AI). **The Worker owns the rules (dice, HP, XP, gold); the AI only narrates.**

## How to gather context (fewest steps)
All paths in this file and in every doc are relative to **the folder that contains this `AGENTS.md`** (the project root). Resolve them from here, not from any parent directory.

1. Find your task in the routing table below and read **all** its docs **in one parallel batch** of tool calls. Don't read them one at a time.
2. Each code file has a doc under `docs/code/` that mirrors its path (`worker/src/services/combat.ts` → `docs/code/worker/src/services/combat.md`). Each doc starts with a `Code:` line linking its source files. Docs give purpose, key values, rules, bugs, and `Anchors:` (`symbol:line`). Answer from the docs when they cover it.
3. Open code only to confirm or change something, and view just the anchored line range, not the whole file.
4. Unknown symbol, endpoint, or file? Look it up in the **Symbol index** at the end of [code.md](code.md) instead of searching.
5. Requirements, setup, deployment: [docs/PRD.md](docs/PRD.md), [docs/SETUP.md](docs/SETUP.md), [docs/DEPLOYMENT_NOTES.md](docs/DEPLOYMENT_NOTES.md). Read only the relevant section.
6. Editing docs or code? Follow [docs/AUTHORING.md](docs/AUTHORING.md). Bug IDs (`B-01`…) refer to `bugs.md` at the repository root.

## Routing table
| Working on | Read in one batch |
|---|---|
| Combat (attack, dodge, flee, monsters, loot) | [docs/flows/combat.md](docs/flows/combat.md), [docs/code/worker/src/services/combat.md](docs/code/worker/src/services/combat.md) |
| Free-text actions, AI DM loop | [docs/flows/action-loop.md](docs/flows/action-loop.md), [docs/code/worker/src/services/ai-dm.md](docs/code/worker/src/services/ai-dm.md) |
| AI prompts, models, fallbacks, JSON parsing | [docs/code/worker/src/services/ai-dm.md](docs/code/worker/src/services/ai-dm.md) |
| Character creation, stats, starting gear | [docs/flows/character-creation.md](docs/flows/character-creation.md) |
| Level-up, XP | [docs/flows/level-up.md](docs/flows/level-up.md) |
| Sessions, resume, KV expiry | [docs/flows/resume-session.md](docs/flows/resume-session.md) |
| Inventory, equip, potions, shops | [docs/flows/inventory.md](docs/flows/inventory.md) |
| New endpoint or feature (what files to change) | [docs/flows/add-endpoint.md](docs/flows/add-endpoint.md) |
| CORS, bindings, route mounts | [docs/code/worker/src/index.md](docs/code/worker/src/index.md) |
| Schema, seed data, item/monster IDs | [docs/code/worker/migrations/0001_initial_schema.md](docs/code/worker/migrations/0001_initial_schema.md), [docs/code/worker/src/db/seed.md](docs/code/worker/src/db/seed.md) |
| Types and rule constants | [docs/code/worker/src/types/index.md](docs/code/worker/src/types/index.md), [docs/code/frontend/src/app/models/game.models.md](docs/code/frontend/src/app/models/game.models.md) |
| Frontend routing, auth, client state | [docs/code/frontend/src/app/app.routes.md](docs/code/frontend/src/app/app.routes.md), [docs/code/frontend/src/app/services/auth.service.md](docs/code/frontend/src/app/services/auth.service.md), [docs/code/frontend/src/app/services/character-state.service.md](docs/code/frontend/src/app/services/character-state.service.md) |
| HTTP client (frontend ↔ Worker) | [docs/code/frontend/src/app/services/game-api.service.md](docs/code/frontend/src/app/services/game-api.service.md) |
| Theme, global styles, dialogs/overlays | [docs/code/frontend/src/styles.md](docs/code/frontend/src/styles.md) |
| Anything else | [code.md](code.md): full doc index plus symbol index |
