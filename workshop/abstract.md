# AI Dungeon — Workshop Abstract

**Format:** Hands-on workshop
**Duration:** 4 hours
**Level:** Intermediate (comfortable with TypeScript; no Cloudflare or LLM experience required)
**Stack:** Angular 18, Cloudflare Workers (Hono), D1, Workers KV, Workers AI

## Short abstract (for program listings, ~100 words)

Large language models are great at prose and terrible at math — so what happens when you build a game that needs both? In this hands-on workshop, we build AI Dungeon, a text-driven D&D-inspired RPG, from an empty folder to a deployed app. An AI Dungeon Master narrates every scene, but a Cloudflare Worker rolls every die: attack rolls, damage, XP, and loot are all resolved in code, never left to the model. Working in Angular, Hono, D1, and Workers AI, you'll build character creation, turn-based combat, an inventory economy, and the prompt engineering that holds it all together — then ship it.

## Full description

Ask an LLM to run a combat encounter and it will cheerfully let your level-1 fighter one-shot a dragon, because it has no concept of dice, hit points, or fairness — it's a language model, not a rules engine. AI Dungeon is built around the opposite premise: **the Worker is the source of truth for rules, the AI is the source of truth for prose.** Every mechanical decision — attack rolls, damage, XP thresholds, loot tables — happens in deterministic server code. The AI only ever narrates results it's handed, never invents them. That single architectural choice is what separates "an LLM wrapper" from a working game, and it's the thread that runs through every phase of this workshop.

Over four hours, in ten short phases, you'll build:

- **The data layer** — a Cloudflare D1 schema for characters, inventory, monsters, and quests
- **The rules engine** — a server-side dice roller, ability scores, and character creation
- **The AI Dungeon Master** — structured prompt engineering, a primary/fallback model strategy, and defensive JSON parsing that survives a model behaving badly
- **The Angular frontend** — signal-based state, a game console, and a dark-fantasy UI
- **Combat and progression** — turn-based encounters and D&D 5e-style leveling
- **The economy** — shops, inventory, and a paginated adventure log
- **A real deployment** — including the ten production issues we actually hit shipping this exact app, from CORS wildcard matching to a mid-project model deprecation

Each phase ships as a `starter/` (TODO-stubbed files to fill in) and a `solution/` (the finished code), so you can work at your own pace and always have a working checkpoint to fall back to. By the end, you'll have a deployed, playable game — and a template for building any application where an LLM needs to collaborate with code it can't be trusted to replace.

## Who should attend

Developers comfortable with TypeScript who want hands-on experience building a real product on Cloudflare's edge platform (Workers, D1, KV, Workers AI) and a concrete, reusable pattern for combining LLM output with deterministic business logic. No prior Cloudflare or AI/prompting experience is assumed — both are taught from first principles.

## What you'll leave with

- A complete, deployed AI Dungeon Master app you built yourself
- A reusable pattern for validating and recovering from unreliable LLM output in production
- Working familiarity with Cloudflare Workers, D1, KV, and Workers AI
- The full workshop repo (starter/solution code for every phase, plus the finished reference app) to revisit or adapt for your own projects
