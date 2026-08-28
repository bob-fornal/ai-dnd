# Phase 0 · Welcome & Architecture Overview

**Duration:** 15 minutes

## Learning Objectives

- Understand what we're building and why: a single-player, text-driven RPG where an AI Dungeon Master narrates, but the server (not the AI) enforces the rules.
- See the full architecture before writing a line of code, so every later phase has a home on the map.
- Know the 4-hour shape of the day: what happens when, and what a "checkpoint" is.

## The pitch

> "A limitless fantasy adventure where every decision matters, the story remembers you, and an AI always has the next chapter ready."

**AI Dungeon** is a text-driven RPG inspired by tabletop D&D. A player creates a character, types free-form actions ("I search the room for hidden doors"), and an AI Dungeon Master responds with narrative, consequences, and suggested next actions — while combat, dice rolls, XP, and inventory are all resolved deterministically by server code, never by the AI. Read the full [`PRD.md`](../complete-reference/PRD.md) when you get a quiet moment — it's the spec this entire workshop follows section by section.

## Architecture tour

```
Angular SPA (Cloudflare Pages)
        │  HTTPS
        ▼
Cloudflare Worker "game-api" (Hono router)
        │                    │                  │
        ▼                    ▼                  ▼
 Workers KV            Cloudflare D1       Workers AI
 (session state,       (characters,        (@cf/meta/llama-3.3-70b
  conversation          inventory, log,      -instruct-fp8-fast,
  history, TTL 7d)      monsters, items,     DM narrative generation)
                        quests, shops)
```

Walk through each box out loud before coding:

- **Angular SPA** — a standalone-components Angular 18 app, Material-themed, hash-routed (`/#/path`) because Cloudflare Pages serves static files and hash routing needs no server-side rewrite rules.
- **Worker "game-api"** — a single Hono.js router handling every backend concern: prompt construction, rule enforcement (dice, combat, XP), state mutation, response shaping. One deploy target, edge-distributed, scales to zero at idle.
- **Workers KV** — the *hot path*: the current session's location, active quest, last ~20 turns of conversation history, and live combat state. Cheap, fast, eventually-consistent, TTL'd.
- **Cloudflare D1** — the *durable record*: the character sheet, full adventure log, inventory, and all reference data (items, monsters, loot tables, quests, shops). SQLite at the edge.
- **Workers AI** — inference only. It receives a tightly structured prompt and must return tightly structured JSON. It never decides HP, never rolls dice, never remembers anything the Worker doesn't hand it explicitly.

**The one idea to internalize before Phase 4:** the Worker is the source of truth for *rules*; the AI is the source of truth for *prose*. Every phase from here reinforces that split.

## The day ahead

| Time | Phase |
|---|---|
| 0:00 – 0:15 | 00 · Welcome (you are here) |
| 0:15 – 0:25 | [01 · Environment Setup](../phase-01-environment-setup/README.md) |
| 0:25 – 0:45 | [02 · Data Layer](../phase-02-data-layer/README.md) |
| 0:45 – 1:05 | [03 · Worker Core](../phase-03-worker-core/README.md) |
| 1:05 – 1:15 | ☕ Break |
| 1:15 – 1:50 | [04 · AI Dungeon Master](../phase-04-ai-dungeon-master/README.md) |
| 1:50 – 2:15 | [05 · Frontend Foundations](../phase-05-frontend-foundations/README.md) |
| 2:15 – 2:35 | [06 · Game Console UI](../phase-06-game-console-ui/README.md) |
| 2:35 – 2:45 | ☕ Break |
| 2:45 – 3:10 | [07 · Combat & Progression](../phase-07-combat-progression/README.md) |
| 3:10 – 3:25 | [08 · Economy & World](../phase-08-economy-world/README.md) |
| 3:25 – 3:40 | [09 · Deploy & Wrap-up](../phase-09-deploy-wrapup/README.md) |
| 3:40 – 4:00 | Buffer / Q&A |

## How each phase works

From Phase 2 onward, every phase folder has the same shape:

- **`README.md`** — what you're building and why, step-by-step instructions, and a checkpoint to confirm before moving on.
- **`starter/`** — files with `// TODO` markers for you to fill in. Paths mirror the real project (`worker/src/...`, `frontend/src/app/...`).
- **`solution/`** — the same files, complete. Peek if you're stuck, or copy forward if you're behind schedule.

If you ever want to see the fully finished app, it's sitting in [`complete-reference/`](../complete-reference/) — runnable end to end, no assembly required.

## Next

[Phase 1 · Environment & Project Setup →](../phase-01-environment-setup/README.md)
