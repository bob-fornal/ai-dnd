# Phase 2 · Data Layer: D1 Schema, Seed Data & Shared Types

**Duration:** 20 minutes

## Learning Objectives

- Design and write the D1 (SQLite) schema that backs every game system: characters, inventory, monsters, loot, adventure log, quests, and shops.
- Understand how Wrangler's migration system tracks and applies schema changes to a D1 database.
- Seed a working data set so later phases (character creation, combat, shops) have real rows to read.
- Define the shared TypeScript types (`worker/src/types/index.ts`) that keep the schema, the Worker routes, and (eventually) the frontend in sync.

## Prerequisites

Phase 1's `worker/` and `frontend/` skeletons exist and both run locally — `npm run dev` serves `/api/health` from the Worker, and `npm start` serves a blank Angular app. You have real `database_id`/KV ids filled into `worker/wrangler.toml`.

## Concepts

**Why a migrations folder instead of one `schema.sql`?** Wrangler's `d1 migrations apply` command tracks which files under `worker/migrations/` have already run, against a bookkeeping table it manages for you (locally under `.wrangler/state`, remotely in the D1 database itself). Every statement uses `CREATE TABLE IF NOT EXISTS`, so re-applying an already-applied migration is a safe no-op. This workshop only needs one migration file, `0001_initial_schema.sql`, but the numbering convention is what lets you add `0002_...`, `0003_...` later without ever hand-editing a "current schema" file.

**The schema, table by table** (PRD.md section 7 has the authoritative column list for each — use it as your reference while filling in the starter):

- `characters` — the durable player record: identity (name/race/class), progression (level/xp), combat stats (hp/max_hp/ac), gold, and the six D&D ability scores (str/dex/con/int/wis/cha).
- `items` — the item catalog (weapons, armor, potions, misc). `effect` is a JSON *string* column (SQLite has no native JSON type) holding shape like `{"damage":"1d8","attack_bonus":2}` — parsed by Worker code, never by the AI.
- `character_inventory` — a join table between `characters` and `items`, tracking `quantity` and whether the item is `equipped`.
- `monsters` — the bestiary: `cr` (challenge rating) is what the Worker later uses to pick an appropriate enemy for the player's level; `damage_dice` is a dice-notation string like `"2d6+3"` resolved by the dice engine, not the AI.
- `loot_tables` — maps a `monster_id` to an `item_id` with a `drop_chance` (0.0–1.0), rolled server-side on victory.
- `adventure_log` — an append-only history of every DM/player turn, keyed by `session_id`, with an index on `(session_id, created_at DESC)` since it's always queried in reverse-chronological, paginated order (see the `GET /api/log/:sessionId` spec in PRD.md section 9).
- `quests` — seeded quest definitions with a level range (`level_min`/`level_max`) and rewards.
- `shops` / `shop_inventory` — a shop's location and its stock; `stock = -1` means unlimited, and `shop_inventory` uses a composite primary key `(shop_id, item_id)` since a shop can't stock the same item twice.

**Why SQLite booleans are `INTEGER`.** SQLite has no dedicated boolean type — `character_inventory.equipped` is `INTEGER NOT NULL DEFAULT 0`, read as `0`/`1` and mapped to a real `boolean` only in the TypeScript layer (`InventoryEntry.equipped: boolean`).

**Why the `Env` type in `types/index.ts` is never stubbed.** Every other domain type in the starter is trimmed to 1–2 fields plus a TODO, but `Env` (the `AI`/`SESSION_KV`/`DB`/`ENVIRONMENT` bindings) is left fully correct. The Worker needs this exact shape to type-check starting in Phase 3, and there's nothing pedagogically useful about re-deriving binding names that come straight from `wrangler.toml` — the learning here is in the domain model, not the Cloudflare plumbing.

**Why seed data matters this early.** Nothing in Phase 2 calls an API — but Phase 3+ (`POST /api/character/create`, shops, combat) all assume rows already exist in `items`, `monsters`, `quests`, and `shops`. Seeding now means every later phase's checkpoint has real data to exercise, instead of an empty database that makes every response `null` or `[]`.

## Step-by-Step

Work in `starter/worker/`. Each file below has TODOs guiding you toward the real (`solution/`) version — read PRD.md section 7 alongside these.

### 1. `migrations/0001_initial_schema.sql`

The stub lists all nine tables as `-- TODO: CREATE TABLE <name> ( ... )` comments, top-to-bottom in dependency order (a table only appears after the tables it `REFERENCES` via foreign key). Work through them in that order:

1. `characters` — no foreign keys, start here. Give every ability score column a `DEFAULT 10` so a partially-specified insert still works.
2. `items` — no foreign keys. Add a `CHECK (type IN ('weapon','armor','potion','misc'))` constraint so bad data fails fast at insert time rather than surfacing as a bug three phases from now.
3. `character_inventory` — references `characters(id)` and `items(id)`. Use `ON DELETE CASCADE` on the `characters` reference so deleting a test character doesn't leave orphaned inventory rows.
4. `monsters` — references `loot_tables(id)` via `loot_table_id` (nullable — not every monster needs a fixed table).
5. `loot_tables` — references `items(id)`.
6. `adventure_log` — references `characters(id)` with `ON DELETE CASCADE`. Don't forget the index: `CREATE INDEX idx_log_session ON adventure_log(session_id, created_at DESC);`.
7. `quests` — no foreign keys.
8. `shops` — no foreign keys.
9. `shop_inventory` — references `shops(id)` and `items(id)`; primary key is the composite `(shop_id, item_id)`, not an autoincrement id.

Wrap every `CREATE TABLE` in `IF NOT EXISTS` to match the solution and keep migrations idempotent.

### 2. `src/db/seed.sql`

The starter keeps `items` and `monsters` fully seeded (they're reference data other tables point at by numeric id — trimming them would break the worked examples below), plus one real example for `loot_tables`, `quests`, and `shops`/`shop_inventory`, each followed by a `-- TODO: add more <table> rows` comment. Follow the shown pattern:

- **Items are inserted, never given an explicit id** — SQLite autoincrements starting at 1, in insertion order. That's why `loot_tables` can reference `item_id = 3` (Dagger) — count down the `INSERT INTO items` statements above it to confirm. If you add your own items, **append** them at the end of the list; don't reorder or delete existing rows, or every numeric reference below shifts.
- Same rule for `monsters` → `loot_tables.monster_id`, and for `items`/`shops` → `shop_inventory`.
- When adding a new loot table entry, `drop_chance` is a float 0.0–1.0 — the Worker will roll against it on monster defeat starting in Phase 7.

### 3. `src/types/index.ts`

The starter keeps every exported interface/type name from the solution (so nothing you write in later phases has to import a type that doesn't exist yet), but strips most domain types down to 1–2 obvious fields plus `// TODO: add remaining fields — see PRD.md section 7`. Work through `Character`, `Item`, `InventoryEntry`, `Monster`, `SessionData`, and `GameStateChanges`, filling in fields to match their D1/KV counterpart:

- `Character` mirrors the `characters` table columns exactly (including `session_id`, `created_at`, `updated_at`).
- `Item.effect` is typed as `ItemEffect` (already fully defined in the starter) — a TypeScript object — even though it's stored as a JSON string in D1; the Worker parses it on read.
- `SessionData` mirrors the KV schema from PRD.md section 7 (`characterId`, `location`, `activeQuestId`, `activeQuestSummary`, `inCombat`, `combatState`, `history`), not the D1 schema.
- `GameStateChanges` mirrors the AI DM response schema from PRD.md section 4.2 (F-09) — `hpDelta`, `xpGained`, `goldDelta`, `itemsAdded`, `itemsRemoved`, `locationChange`, `questUpdate`, `combatInitiated`, `combatEnded`.

Leave `Env`, the API request/response body interfaces, and the D&D rule constants (`XP_THRESHOLDS`, `STANDARD_ARRAY`, `CLASS_HIT_DICE`, `CLASS_STARTING_AC`, `RACE_BONUS`) exactly as they appear in the starter — they're already complete.

## Code Walkthrough (solution)

- **`migrations/0001_initial_schema.sql`** — every table uses `CREATE TABLE IF NOT EXISTS`; note `character_inventory.character_id` and `adventure_log.character_id` both cascade-delete, but `loot_tables`/`shop_inventory` don't — a deleted item or monster leaving a dangling loot/stock row is treated as harmless dead data rather than something worth cascading.
- **`src/db/seed.sql`** — the full version seeds three shops (not just one), each with its own inventory list, three loot tables (Goblin, Skeleton, Orc Scout), and five quests spanning the full level 1–10 range. Note `''` escaping for apostrophes in quest text (`'The Dragon''s Hoard'`) — standard SQL string escaping, easy to miss if you're copy-pasting from prose.
- **`src/types/index.ts`** — `XP_THRESHOLDS` is a `readonly` tuple (`as const`) indexed by level-1, matching D&D 5e's standard thresholds from PRD.md F-28. `RACE_BONUS` and `CLASS_STARTING_AC`/`CLASS_HIT_DICE` are `Record` types keyed by the `Race`/`CharacterClass` unions, which is what lets character-creation code (Phase 3) do `CLASS_STARTING_AC[character.class]` with full type safety instead of a runtime lookup that could silently return `undefined`.

## Checkpoint

Apply the migration locally:
```bash
cd worker
wrangler d1 migrations apply ai-dnd-db --local
```
Expect a success message listing `0001_initial_schema.sql` as applied.

Seed the local database:
```bash
npm run db:seed:local
```

Verify data landed:
```bash
wrangler d1 execute ai-dnd-db --local --command "select count(*) from items"
```
Expect a nonzero count (27 with the full solution seed data; still nonzero even with just the starter's worked examples, since `items` is kept fully populated there too).

Also worth spot-checking:
```bash
wrangler d1 execute ai-dnd-db --local --command "select id, name, cr from monsters"
wrangler d1 execute ai-dnd-db --local --command "select id, title from quests"
```

## Common Pitfalls

- **Reordering or deleting seed rows.** Because ids come from insertion order, moving a row (or deleting one to "clean up") silently breaks every foreign-key reference below it — a `loot_tables` row can end up pointing at the wrong item with no error, just wrong gameplay data. Always append.
- **Forgetting `--local`.** `wrangler d1 migrations apply ai-dnd-db` (no flag) targets your *remote* production D1 database. Always pass `--local` during development; you'll only drop it once, deliberately, in the deployment phase.
- **Treating `effect`/JSON columns as real JSON in SQL.** D1 (SQLite) stores `effect` as plain `TEXT`. Don't try to query into it with SQL — parsing happens in the Worker (`JSON.parse`), not the database.
- **Skipping the `CHECK` constraints.** They're what turn a typo like `type = 'weopon'` into an immediate insert failure instead of a silent bad row that only surfaces as a confusing bug in the shop UI three phases later.
- **Missing rows for a table another phase depends on.** If your `starter` edits accidentally leave `items` or `monsters` empty, character creation (Phase 3) and combat (Phase 7) have nothing to work with — re-run the checkpoint's `count(*)` queries after any edits.

## Next

[Phase 3 · Worker Core](../phase-03-worker-core/README.md)
