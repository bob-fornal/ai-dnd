# AI Dungeon

A single-player, text-driven, D&D-inspired RPG where an AI Dungeon Master narrates the story and a Cloudflare Worker enforces the rules. This repo serves two purposes:

1. **A working game.** Create a character, type free-form actions, fight monsters, level up, shop in town, and pick your adventure back up later.
2. **Workshop material.** A 4-hour, hands-on workshop that teaches Cloudflare Workers AI (plus Workers, D1, and KV) by building the game from an empty folder to a deployed app.

The game was designed and built with AI assistance, and the repo is also used to try out ways of working with AI coding tools more efficiently. The [next phase](#next-phase-component-focused-documentation) covers that experiment.

---

## The core idea

LLMs are good at prose and bad at arithmetic. Ask one to run a combat encounter and your level-1 fighter will one-shot a dragon.

So the work is split:

- **The Worker owns the rules.** Dice rolls, attack and damage math, HP, XP thresholds, loot tables, and gold all run as deterministic TypeScript on the server.
- **The AI owns the prose.** Workers AI receives the results the Worker already computed and narrates them. It doesn't decide outcomes.

Every phase of the workshop builds on that split.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 18 SPA (signals, standalone components), hosted on Cloudflare Pages |
| API | Cloudflare Worker using the [Hono](https://hono.dev) router |
| AI | Workers AI: `@cf/meta/llama-3.3-70b-instruct-fp8-fast` as the primary DM, with a fallback model |
| Relational data | Cloudflare D1 (characters, inventory, adventure log, monsters, items, quests, shops) |
| Session state | Workers KV (active session, recent conversation history, 7-day TTL) |

```
Angular SPA (Cloudflare Pages)
        │  HTTPS  /api/*
        ▼
Cloudflare Worker (Hono router)
        │                  │                 │
        ▼                  ▼                 ▼
   Workers KV         Cloudflare D1      Workers AI
   (sessions,         (game data)        (DM narrative)
    history)
```

## Repository layout

```
ai-dnd/
├── bugs.md                   Known bugs (B-01…) in complete/, research-documentation/implementation-v*, and workshop/
├── complete/                 The finished, runnable application
│   ├── PRD.md                Product requirements, data model, API spec, prompt design
│   ├── SETUP.md              Local dev + deployment guide
│   ├── docs/
│   │   └── DEPLOYMENT_NOTES.md   Production issues hit while shipping, and their fixes
│   ├── worker/               Cloudflare Worker (Hono routes, services, D1 migrations, seed data)
│   └── frontend/             Angular 18 SPA
│
├── research-documentation/   The documentation-for-agents research (start at its README.md)
│   ├── docs/                 Write-ups (v2–v6), talk shell, next steps, Bob's notes
│   ├── work/                 Test harness (Copilot CLI + Claude Code), tasks, results
│   ├── implementation-v1/    Copy of complete/ with component docs beside the code (code.md index)
│   ├── implementation-v2/    Auto-loaded AGENTS.md routing table, flow docs, symbol index
│   ├── implementation-v3/    v2 + root-relative paths and named value sources
│   ├── implementation-v4/    v3 with component docs in docs/code/ (most efficient on Copilot)
│   ├── implementation-v5/    v4 + routing rows for every Worker route area
│   └── implementation-v6/    v4 + tools/read.mjs multi-target reader
│
└── workshop/                 The 4-hour workshop
    ├── README.md             Agenda, structure, and how to follow along
    ├── abstract.md           Talk/workshop abstract for program listings
    ├── slides/               Presentation deck
    ├── complete-reference/   Copy of the finished app, used as the safety net during the workshop
    └── phase-00 … phase-09/  One folder per workshop phase
```

### `complete/`: the game

The full application. The Worker exposes routes for characters, player actions, combat, level-up, shops, quests, sessions, and the adventure log. The services under `worker/src/services/` hold the AI DM prompt builder, the dice engine, the combat resolver, character rules, and session handling. The frontend has login, character creation, the game console, the character sheet, and inventory.

To run it locally, follow [complete/SETUP.md](complete/SETUP.md). The short version:

```bash
cd complete/worker && npm install && npm run dev
```

```bash
cd complete/frontend && npm install && npm start
```

The Worker runs on `http://localhost:8787` and the Angular dev server on `http://localhost:4200`. You'll need a Cloudflare account with Workers AI access and a D1 database and KV namespace created through Wrangler first. SETUP.md walks through both.

### `workshop/`: the Workers AI workshop

A 4-hour build of the same app, split into ten phases:

| Phase | Topic |
|---|---|
| 00 · Welcome | Vision, architecture tour, PRD walkthrough |
| 01 · Environment Setup | Wrangler, D1, KV, project scaffold |
| 02 · Data Layer | D1 schema, seed data, shared types |
| 03 · Worker Core | Hono router, dice engine, character service |
| 04 · AI Dungeon Master | Prompt engineering, Workers AI, defensive JSON parsing |
| 05 · Frontend Foundations | Models, services, login, character creation |
| 06 · Game Console UI | The main play screen, wired end to end |
| 07 · Combat & Progression | Server-side dice combat, XP, leveling |
| 08 · Economy & World | Shops, inventory, quests, adventure log |
| 09 · Deploy & Wrap-up | Shipping to Cloudflare, plus the real deployment gotchas |

Each code phase has a `README.md` (objectives, steps, walkthrough, checkpoint), a `starter/` folder with `// TODO` stubs, and a `solution/` folder with the finished files. Starter paths mirror the real project, so attendees copy them straight into their own `worker/` and `frontend/` folders. If someone falls behind, they copy from `solution/` or `complete-reference/` and keep going.

Start at [workshop/README.md](workshop/README.md) for the full agenda and timing. [workshop/abstract.md](workshop/abstract.md) has copy for submitting the workshop to a conference or meetup.

---

## Next phase: component-focused documentation

### The problem

The current documentation is organized the usual way for a project: one big PRD, one setup guide, one set of deployment notes. That's fine for people. For an AI coding assistant it's expensive. Changing the combat resolver, for example, means pulling most of the 500+ line PRD into context to find the parts about combat, plus the setup and deployment docs in case something there matters. Most of those tokens have nothing to do with the task.

### The experiment

The next phase duplicates the current `complete/` folder into [`research-documentation/implementation-v1/`](research-documentation/implementation-v1/) and restructures the documentation around **components** rather than **document types**. The application code stays the same, so the only variable is how the docs are organized.

The plan:

- **Split the monolithic docs.** Break `PRD.md`, `SETUP.md`, and `DEPLOYMENT_NOTES.md` into small, focused documents scoped to one component each: the AI DM, dice and combat, characters and progression, inventory and shops, sessions and KV, the adventure log, and each major frontend feature.
- **Co-locate docs with code.** Put each component's documentation next to the code it describes (for example, alongside `worker/src/services/combat.ts` or `frontend/src/app/components/game-console/`), so the relevant context is easy to find.
- **Keep a thin index.** A short top-level map tells the assistant which component doc covers which area. It reads the index plus one or two component docs instead of the whole PRD.
- **Separate cross-cutting concerns.** Things that really are global (the "Worker owns the rules, AI owns the prose" principle, shared types, deployment config) go in a small number of short shared docs rather than being repeated or buried.

### What it should show

The hypothesis is that component-scoped docs reduce token usage per task without hurting the quality of the work, because the assistant reads only the context that applies. With `complete/` and the restructured copy side by side, the same tasks can be run against both and compared on:

- Tokens consumed per task
- Number of documents read to gather context
- Whether the resulting change is correct and consistent with the rest of the app

If it works, the pattern applies beyond this game: any codebase that leans on AI assistants could organize its docs this way.

### Measuring it

[`research-documentation/work/`](research-documentation/work/README.md) runs the same read-only questions against `complete/` and `research-documentation/implementation-v1/` with the Copilot CLI. It records total input and output tokens, AI credits, which docs and code files the agent read, and a keyword score for each answer, then summarizes the medians for each folder.

The first results showed that cost is driven by the number of model round trips, not by document size. [`research-documentation/docs/research-documentation-v2.md`](research-documentation/docs/research-documentation-v2.md) describes the resulting v2 design in [`research-documentation/implementation-v2/`](research-documentation/implementation-v2/): an auto-loaded `AGENTS.md` routing table, flow docs, and a generated symbol index. Measuring v2 exposed a harness flaw and two doc gaps; [`research-documentation/docs/research-documentation-v3.md`](research-documentation/docs/research-documentation-v3.md) covers the v3 fixes and the isolated re-run of every arm. [`research-documentation/docs/research-documentation-v4.md`](research-documentation/docs/research-documentation-v4.md) tests moving component docs out of the source tree into `docs/code/`.

**Current result** (`iso-1`, 330 isolated runs, same answer quality): an auto-loaded `AGENTS.md` routing table plus flow docs cut input tokens by **46–50%** and AI credits by about **30%** against the original document-type docs (v3 and v4 vs `complete`). Whether component docs sit beside the code or in `docs/code/` makes no measurable difference. Giving every route area a routing row (v5) fixed the one task where the docs lost to the baseline. Details: [v3 §5](research-documentation/docs/research-documentation-v3.md), [v4 §4](research-documentation/docs/research-documentation-v4.md), [v5 §5](research-documentation/docs/research-documentation-v5.md), and [v6 §5](research-documentation/docs/research-documentation-v6.md). A multi-file read tool (v6) was adopted by agents but saved no round trips: once docs are routed, missing facts, not read batching, drive the remaining cost. The same suite on **Claude Code** (462 runs) shows the same ranking with smaller savings (best −25% input, −25% cost), because Claude's unguided baseline is already lean.

---

## Author

Bob Fornal, Leading EDJE
