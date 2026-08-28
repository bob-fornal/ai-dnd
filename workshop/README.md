# AI Dungeon — 4-Hour Build Workshop

Build **AI Dungeon**, a text-driven D&D-inspired RPG with an AI Dungeon Master, from an empty folder to a deployable Cloudflare app (Angular 18 frontend + Hono/Cloudflare Worker backend + D1 + KV + Workers AI).

By the end you will have built, by hand, everything in [`complete-reference/`](complete-reference/) — that folder is the finished app and is your safety net: if you fall behind or a stub stumps you, copy the matching file(s) out of it and keep moving.

---

## Who this is for

- Comfortable with TypeScript and either Angular or another component framework.
- No Cloudflare experience required — Phase 1 covers account/tooling setup from zero.
- No prior AI/LLM prompting experience required — Phase 4 teaches prompt engineering from first principles.

## How the workshop is organized

```
workshop/
├── slides/                        Presentation deck (AI-Dungeon-Workshop.pptx)
├── complete-reference/            The finished app — full working copy, for comparison/rescue
├── phase-00-welcome/              Kickoff — no code
├── phase-01-environment-setup/    Cloudflare + project scaffold
├── phase-02-data-layer/           D1 schema, seed data, shared types
├── phase-03-worker-core/          Hono router, dice engine, character service
├── phase-04-ai-dungeon-master/    The AI DM: prompt engineering + Workers AI
├── phase-05-frontend-foundations/ Angular models, services, login, character creation
├── phase-06-game-console-ui/      The main play screen
├── phase-07-combat-progression/   Turn-based combat + leveling
├── phase-08-economy-world/        Shops, inventory, quests, adventure log
└── phase-09-deploy-wrapup/        Ship it, plus every real deployment gotcha we hit
```

Each code phase (`phase-02` … `phase-08`) has the same shape:

- **`README.md`** — learning objectives, step-by-step instructions, a code walkthrough, and a checkpoint to verify you're on track before moving on.
- **`starter/`** — the files you'll edit, scaffolded with `// TODO` markers and signatures. File paths mirror the real project (`worker/src/...`, `frontend/src/app/...`) so you can copy them straight into your own working project.
- **`solution/`** — the same files, fully implemented. Use it to check your work or to catch up.

Phase 00, 01, and 09 don't have a starter/solution split — they're setup, scaffolding, and deployment respectively.

## Setting up your working project

Do this once, in Phase 1, and keep editing the same two folders (`worker/` and `frontend/`) for the rest of the day:

```bash
mkdir my-ai-dnd && cd my-ai-dnd
mkdir worker frontend
```

Every later phase tells you exactly which files under `worker/` or `frontend/` to add or change. Copy the `starter/` files in, fill in the TODOs using the phase README, and diff against `solution/` when you want to check yourself.

## The 4-hour agenda

| Time | Phase | Topic |
|---|---|---|
| 0:00 – 0:15 | [00 · Welcome](phase-00-welcome/README.md) | Vision, architecture tour, PRD walkthrough |
| 0:15 – 0:25 | [01 · Environment Setup](phase-01-environment-setup/README.md) | Wrangler, D1, KV, project scaffold |
| 0:25 – 0:45 | [02 · Data Layer](phase-02-data-layer/README.md) | D1 schema, seed data, shared types |
| 0:45 – 1:05 | [03 · Worker Core](phase-03-worker-core/README.md) | Hono router, dice engine, character service |
| 1:05 – 1:15 | ☕ Break | |
| 1:15 – 1:50 | [04 · AI Dungeon Master](phase-04-ai-dungeon-master/README.md) | Prompt engineering, Workers AI, JSON validation |
| 1:50 – 2:15 | [05 · Frontend Foundations](phase-05-frontend-foundations/README.md) | Models, services, login, character creation |
| 2:15 – 2:35 | [06 · Game Console UI](phase-06-game-console-ui/README.md) | The main play screen, wired end-to-end |
| 2:35 – 2:45 | ☕ Break | |
| 2:45 – 3:10 | [07 · Combat & Progression](phase-07-combat-progression/README.md) | Server-side dice combat, XP, leveling |
| 3:10 – 3:25 | [08 · Economy & World](phase-08-economy-world/README.md) | Shops, inventory, quests, adventure log |
| 3:25 – 3:40 | [09 · Deploy & Wrap-up](phase-09-deploy-wrapup/README.md) | Ship to Cloudflare, real-world gotchas, Q&A |
| 3:40 – 4:00 | Buffer / Q&A | Catch-up time, open questions from the PRD |

Total: 4 hours, including two 10-minute breaks and a buffer block that absorbs overrun.

## Architecture at a glance

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

The Worker is the source of truth for rules (dice, combat math, XP) — the AI only narrates. This split is the single most important design decision in the app and is explained in depth in Phase 4.

## Reference documents

The original planning documents for this project are copied into `complete-reference/` and are worth reading alongside the workshop:

- [`complete-reference/PRD.md`](complete-reference/PRD.md) — full product requirements, data model, API spec
- [`complete-reference/SETUP.md`](complete-reference/SETUP.md) — condensed setup/deploy reference
- [`complete-reference/docs/DEPLOYMENT_NOTES.md`](complete-reference/docs/DEPLOYMENT_NOTES.md) — every production issue hit when shipping this app, and the fix — Phase 9 walks through these live
