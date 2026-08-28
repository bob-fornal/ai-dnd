# Phase 3 · Worker Core: Hono Router, Dice Engine & Character Service

**Duration:** 20 minutes

## Learning Objectives

By the end of this phase you will be able to:

- Structure a Hono application into route modules mounted from a single `index.ts` entry point.
- Write a deterministic, server-side dice engine (no `Math.random()` calls anywhere else in the codebase).
- Implement a D1-backed character service: creating a character, granting starting equipment, and reading it back.
- Implement a Workers KV-backed session service: creating session state, persisting it, and refreshing its TTL on every write.
- Explain why all of this — dice, HP, AC, gold, session state — lives in the Worker instead of being left to the AI.

## Prerequisites

- Phase 2 (Data Layer) complete: the D1 `characters`, `character_inventory`, `items`, and `quests` tables exist and are seeded, and `worker/src/types/index.ts` has the `Character`, `Race`, `CharacterClass`, `AbilityScores`, and rule-constant types (`CLASS_HIT_DICE`, `CLASS_STARTING_AC`, `RACE_BONUS`, `STANDARD_ARRAY`, `XP_THRESHOLDS`). See [`../phase-02-data-layer/README.md`](../phase-02-data-layer/README.md).
- A Workers KV namespace bound as `SESSION_KV` in `wrangler.toml` (set up in Phase 1).

We're also filling in the rest of `types/index.ts` in this phase now that we know exactly what shapes the character and session services need — Phase 2 only stubbed the pieces required for the schema itself.

## Concepts

**The Worker is the source of truth for rules. The AI only narrates.**

This is the single most important architectural decision in the whole app, and Phase 3 is where it first becomes concrete. Every number that matters — ability scores, hit points, armor class, starting gold, session TTL — is computed and persisted by plain TypeScript running on the Worker, using D1 and KV. There is no AI call anywhere in this phase.

Why insist on this now, before the AI even shows up in Phase 4?

- **Determinism.** `roll4d6DropLowest()` either returns a fair 3–18 or it's a bug you can unit test. An LLM asked to "roll 4d6 drop lowest" will happily hallucinate a number that feels right instead of one that *is* right.
- **Auditability.** A dice roll computed in the Worker can be logged, replayed, and reasoned about. A dice roll narrated by an LLM is a black box.
- **Trust boundary.** Once Phase 4 wires up Workers AI, the DM will be asked to narrate outcomes, not decide them. It gets told "the player hit for 7 damage" — it doesn't get to invent the 7. Building the rules engine first, with no AI in sight, makes that boundary impossible to blur later.
- **Cost & latency.** D1/KV round-trips are cheap and fast; every unnecessary AI call is both slower and more expensive. Reserve Workers AI for the one thing it's actually good at: prose.

By the end of this phase the Worker can create a character and hand it back — deterministically, with no AI involved — plus return raw session state from KV. Phase 4 layers narrative on top of exactly this foundation.

## Step-by-Step

### 1. Implement `services/dice.ts`

Start here — it's the most self-contained file in the phase and everything else depends on it.

Open `starter/worker/src/services/dice.ts`. The exported signatures and JSDoc comments are already in place; each body is a `TODO` plus a `throw new Error('not implemented')`. Implement, in order:

1. `roll(sides)` — a single fair die roll.
2. `rollExpression(expr)` — parse strings like `"2d6+3"` or `"1d8"` with a regex, roll `count` dice of `sides` faces, sum them, add the modifier, floor at 0.
3. `roll4d6DropLowest()` — roll four d6, sort, drop the lowest, sum the rest.
4. `rollAbilityScores()` — call `roll4d6DropLowest()` six times for `str/dex/con/int/wis/cha`.
5. `modifier(score)` — the standard 5e `floor((score - 10) / 2)`.
6. `attackRoll(attackBonus, targetAC)` — d20 + bonus vs. AC, with crit/fumble handling.

Compare against `solution/worker/src/services/dice.ts` when done.

### 2. Implement `services/character.ts`

This is where ability scores turn into a saved character. `starter/worker/src/services/character.ts` keeps every export and the D1 SQL as commented hints. Implement:

- `createCharacter()` — roll or take the standard array, apply `RACE_BONUS`, compute HP from `CLASS_HIT_DICE` + CON modifier and AC from `CLASS_STARTING_AC` (Rogues also add their DEX modifier), `INSERT` into `characters`, then call `grantStartingEquipment()`.
- `grantStartingEquipment()` — batch-insert the class's starting items from `CLASS_STARTING_ITEMS` into `character_inventory`.
- `getCharacter()` — a single `SELECT * FROM characters WHERE id = ?`.
- `updateCharacter()` — a dynamic `SET` clause built from whatever fields changed. (Used starting in Phase 4/7 — implement it now while the pattern is fresh.)
- `getInventory()` — join `character_inventory` to `items` and shape the result into `InventoryEntry[]`.

`levelUp()` and `shouldLevelUp()` are stubbed too but aren't exercised until Phase 7 (Combat & Progression) — feel free to leave them as `throw new Error('not implemented')` for now.

### 3. Wire up `routes/character.ts`

`starter/worker/src/routes/character.ts` already has the Hono route structure, JSON body parsing, and validation for `POST /create` and `GET /:id` — only the calls into the character/session services and the response shape are stubbed. Fill in:

- `POST /create` — call `createCharacter()`, then `newSession()` + `saveSession()` to seed KV, then return `{ characterId, sessionId, character, backstory: '', startNarrative }`. (`backstory` stays empty this phase — Phase 4 adds the AI-generated version.)
- `GET /:id` — call `getCharacter()` (404 if missing), `getInventory()`, and look up the active quest, then return them together.

The `PATCH /:id/equip` and `DELETE /:id/inventory/:itemId` handlers are already complete — they only touch D1 directly plus `getInventory()`, so there's nothing new to implement there.

### 4. Implement `services/session.ts`

`starter/worker/src/services/session.ts` stubs the KV read/write functions. Implement:

- `loadSession()` — `kv.get(sessionKey(id), 'json')`.
- `saveSession()` — trim `history` to the last 20 turns, then `kv.put(...)` with `expirationTtl` set to 7 days. This `put` call is what refreshes the TTL on every write — see PRD.md section 4.5 and the KV Schema in section 5.
- `newSession()` — build the initial `SessionData` (starting location, level-1 starter quest, empty history).
- `appendHistory()` — push a turn, trim if needed.

`rebuildSession()` is stubbed too but isn't needed until a later phase (recovering from an expired KV session using the D1 adventure log) — leave it as-is.

`routes/session.ts` is provided complete and unstubbed — at 21 lines it's a thin `GET /:id` that calls `loadSession()` and `getCharacter()`. Skim it, no changes needed.

### 5. Wire the routes into `index.ts`

Both `starter/worker/src/index.ts` and `solution/worker/src/index.ts` are provided as-is for this phase — don't edit them, just follow along. The starter has two `TODO` comments showing exactly where to:

```ts
import { characterRoutes } from './routes/character.js';
import { sessionRoutes }   from './routes/session.js';
// ...
app.route('/api/character', characterRoutes);
app.route('/api/session',   sessionRoutes);
```

along with a `GET /api/health` route. Check the provided `solution/worker/src/index.ts` for the exact final shape.

## Code Walkthrough (solution)

- `solution/worker/src/services/dice.ts` — the complete dice engine, 61 lines.
- `solution/worker/src/services/character.ts` — character creation, equipment granting, fetch/update/inventory/level-up.
- `solution/worker/src/services/session.ts` — KV session load/save/create/append/rebuild.
- `solution/worker/src/routes/character.ts` — `POST /create`, `GET /:id`, plus the equip/drop inventory endpoints. Note the opening narrative in `POST /create` falls back to a static line when `backstory` is empty — Phase 4 fills `backstory` in via Workers AI without changing this file's shape.
- `solution/worker/src/routes/session.ts` — the thin `GET /:id` handler.
- `solution/worker/src/types/index.ts` — the full shared type file (Character, Race, CharacterClass, Item, SessionData, API bodies, and the D&D rule constant tables).

## Checkpoint

From your `worker/` directory:

```bash
npm run dev
```

Create a character:

```bash
curl -X POST http://localhost:8787/api/character/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Thorin","race":"Dwarf","class":"Fighter","abilityRollMethod":"standard"}'
```

Expect a `200` with `{ characterId, sessionId, character: { ...str/dex/con/... }, backstory: "", startNarrative }`. `character.race` should be `"Dwarf"`, and `str`/`con` should be 1–2 points higher than the standard array thanks to `RACE_BONUS`.

Fetch it back:

```bash
curl http://localhost:8787/api/character/<characterId>
```

Expect `{ character, inventory, activeQuest }` — `inventory` should list four starting items for a Fighter (Longsword, Shield, Potion, Rations).

Fetch the raw session:

```bash
curl http://localhost:8787/api/session/<sessionId>
```

Expect `{ session, character }`, where `session.history` is an empty array and `session.location` is `"Millhaven — The Rusty Flagon Inn"`.

## Common Pitfalls

- **`abilityRollMethod` defaults.** The route defaults a missing `abilityRollMethod` to `'standard'` — if your `createCharacter()` doesn't handle both `'roll'` and `'standard'`, standard-array characters will come back with `undefined` scores.
- **Off-by-one on the ability roll.** `roll4d6DropLowest()` must drop the lowest of *four* dice, not just sum three fresh ones — `.sort((a,b) => a-b).shift()` before summing.
- **Forgetting to bind SQL parameters in order.** The `characters` INSERT has 19 placeholders — a single misordered `.bind()` argument silently corrupts a stat instead of throwing.
- **KV TTL confusion.** `expirationTtl` is set on every `saveSession()` call, so the 7-day clock resets on every session write — it's not a fixed expiry from creation. Don't try to compute an absolute expiry timestamp yourself.
- **`getCharacter()` returning `undefined` vs `null`.** D1's `.first()` returns `undefined` when no row matches; the type signature promises `Character | null`, so coerce it (`?? null`) or downstream `!character` checks can behave unexpectedly with strict equality elsewhere.
- **No AI here.** If you find yourself reaching for `c.env.AI` in this phase, stop — that's Phase 4. `backstory` is intentionally `''` for now.

## Next

Continue to [Phase 4 · AI Dungeon Master](../phase-04-ai-dungeon-master/README.md), where Workers AI generates the character backstory and narrates player actions on top of the rules engine you just built.
