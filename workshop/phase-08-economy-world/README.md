# Phase 8 · Economy & World

**Duration:** 15 minutes (3:10 – 3:25) — the last feature phase. After this, your app matches `complete-reference/` in full.

---

## Learning Objectives

By the end of this phase you will be able to:

- Implement a gold/inventory transaction endpoint (buy/sell) that keeps a character's gold and `character_inventory` rows consistent.
- Explain why shops and inventory are durable D1 writes rather than KV session state, reinforcing the KV/D1 split from Phase 3 (PRD F-17–F-20).
- Implement offset/limit pagination over a reverse-chronological log table.
- Build out the actual logic behind an Angular component whose template and styles you were handed, unstubbed, back in Phase 6.

## Prerequisites

- Phase 7 complete: combat and leveling work end-to-end.
- `worker/src/routes/shop.ts`, `worker/src/routes/quest.ts`, and `worker/src/routes/log.ts` exist as stubs (copy them from `starter/worker/src/...` if you haven't already).
- `frontend/src/app/components/inventory/inventory.component.ts` exists in your project **already fully working** from Phase 6 — that copy was supporting scaffolding so `GameConsoleComponent` would compile and the dialog would open. This phase, you replace it with the stubbed version from this phase's `starter/` and build out its three action methods for real.

---

## Concepts

### 1. KV vs. D1, reinforced a third time

By now the pattern should feel automatic: **KV** holds hot, ephemeral, per-session state (conversation history, `combatState`) with a 7-day TTL; **D1** holds everything that must survive forever and be queried relationally (F-23). Shops and inventory are the clearest possible case for D1 — a character's gold and owned items are exactly the kind of fact you cannot afford to lose to a KV eviction, and "does this character have 3 Healing Potions?" is a relational question `character_inventory` answers directly. `shop.ts`'s buy/sell handlers never touch KV at all; they're pure D1 reads and writes (F-17–F-19).

### 2. The pagination pattern

`log.ts` implements the same shape you'll reach for anywhere a table can grow unbounded: `page`/`limit` query params, clamped to sane bounds (`limit` capped at 50 so nobody can request the entire adventure log in one call), converted to a SQL `LIMIT`/`OFFSET`, plus a separate `COUNT(*)` query so the client knows when it's reached the end (F-27). One subtlety worth noticing: the D1 query orders `DESC` (newest first, so the *first page* is cheap to fetch), but the handler reverses the page's results before returning them, so the UI can render each page top-to-bottom in the order events actually happened.

### 3. A note on PRD F-20 (weight limit)

The PRD specifies a carry-weight limit (`STR score × 15 lbs`). The reference `shop.ts` you're copying from does **not** enforce it — the buy/sell logic only checks gold and stock. The starter's TODOs call this out as an optional stretch goal (sum inventory weight via a join, compare against `character.str * 15`) rather than asking you to implement something the shipped app itself skipped. Don't be surprised when the solution file doesn't have it either — that's accurate to what's actually running in `complete-reference/`.

---

## Step-by-Step

1. Open `starter/worker/src/routes/shop.ts`. The item/character lookups are already implemented — the buy and sell branches are `TODO`.
2. Implement the `buy` branch: compute `totalCost`, check gold, check `shop_inventory.stock` (`-1` means unlimited), then persist gold deduction + inventory upsert + stock decrement in a single `db.batch([...])` so the transaction is atomic.
3. Implement the `sell` branch: compute the sale price at half value (floored), verify the character actually holds enough of the item, then persist gold addition + inventory delete-or-decrement in one batch.
4. Open `starter/worker/src/routes/quest.ts` and fill in `/generate` (call `generateQuest()`, stash the summary on the session, save it) and `/list` (a level-filtered `SELECT` over the seeded `quests` table).
5. Open `starter/worker/src/routes/log.ts` and fill in the pagination logic: parse/clamp `page`/`limit`, query `adventure_log` with `LIMIT`/`OFFSET`, reverse the page for chronological display, and run the companion `COUNT(*)`.
6. Wire it up: in your own `worker/src/index.ts`, add the `logRoutes`, `shopRoutes`, and `questRoutes` imports and mount them at `/api/log`, `/api/shop`, and `/api/quest` — see `solution/worker/src/index.ts` for the exact diff against the Phase 7 starter (do not edit either `index.ts` directly).
7. Replace your Phase 6 copy of `frontend/src/app/components/inventory/inventory.component.ts` with this phase's `starter/` version (same template/styles, stubbed methods), then implement `toggleEquip()`, `usePotion()`, and `dropItem()` using `GameApiService.equipItem()` / `.dropItem()` — follow the loading/error/snack-bar pattern already shown in the untouched `loadInventory()` method just above them.
8. Run the Checkpoint below.

If you get stuck, the fully-implemented versions are in `solution/worker/src/routes/shop.ts`, `quest.ts`, `log.ts`, and `solution/frontend/src/app/components/inventory/inventory.component.ts` — copy just the piece you're stuck on.

## Code Walkthrough

- **`routes/shop.ts`**
  - `GET /:id` lists a shop's stock joined against `items` — read-only, mostly plumbing.
  - `POST /transaction` is the focus: it loads the character and the item once, then branches on `buy`/`sell`, each ending in a single `db.batch([...])` write so gold, inventory, and stock never drift out of sync with each other even if the Worker is interrupted mid-request.
- **`routes/quest.ts`** — `/generate` is a thin AI-DM wrapper (same `ai.run()`-backed pattern as `generateLevelUpNarrative` from Phase 7); `/list` is a plain filtered D1 read with no AI involved, seeded in Phase 2.
- **`routes/log.ts`** — the pagination pattern described in Concepts §2; the whole file is about a dozen lines of real logic once the boilerplate is stripped out, which is why it's a light stub.
- **`inventory.component.ts`** — `loadInventory()` (already implemented, unchanged from Phase 6) shows the loading/success/error signal pattern the three TODO methods should follow: guard against overlapping requests with `actionLoading`, call the matching `GameApiService` method, refresh `inventory`/`charSvc` from the response, and surface success/failure via `MatSnackBar`.

## Checkpoint

Start your Worker locally:

```bash
cd worker
npx wrangler dev
```

Buy an item:

```bash
curl -X POST http://localhost:8787/api/shop/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "characterId": "char_test123",
    "shopId": 1,
    "action": "buy",
    "itemId": 3,
    "quantity": 1
  }'
```

Expected: `{ "success": true, "action": "buy", "item": "...", "quantity": 1, "cost": N, "updatedGold": N }`.

Read the adventure log:

```bash
curl "http://localhost:8787/api/log/sess_test123?page=0&limit=20"
```

Expected: `{ "entries": [...], "total": N, "page": 0, "limit": 20 }`, oldest-to-newest within the page.

Then, in the browser: open the Inventory dialog from the game console, switch to a shop or use a seeded starting item, buy something and watch your gold drop, equip a weapon and see the "Equipped" badge appear, use a potion and confirm HP ticks up, then drop an item and confirm it disappears from the list — all without a page reload.

This is the last feature phase. Once your Worker mounts all seven route groups (`character`, `action`, `combat`, `session`, `levelup`, `log`, `shop`, `quest`) and your frontend's Inventory dialog is fully interactive, your project is functionally equivalent to `complete-reference/`.

## Common Pitfalls

- **Batch writes aren't actually atomic across a read-then-write gap.** `db.batch([...])` guarantees the statements inside it commit together, but the stock/quantity checks happen in a separate query *before* the batch. Under real concurrency this is a classic check-then-act race; it's an accepted simplification for a single-player MVP (NF-08 explicitly puts multiplayer out of scope) — just be aware it's not a general pattern for concurrent systems.
- **Selling more than you own.** Verify `inventory.quantity >= quantity` before touching gold — the reference code returns a 400 rather than letting gold go up for items that don't exist.
- **Deleting vs. decrementing on full sell-off.** If `inv.quantity === quantity`, delete the `character_inventory` row entirely rather than leaving a `quantity: 0` row behind — a stray zero-quantity row will still show up as "owned" in naive list queries.
- **`limit` with no upper bound.** Without clamping (`Math.min(50, ...)`) in `log.ts`, a client can request thousands of rows in one call. Cap it even though this is a single-player app — it's the habit that matters.
- **Forgetting the `ON CONFLICT` target.** Just like Phase 7's loot upsert, the shop's inventory upsert needs `ON CONFLICT(character_id, item_id)` to match the real unique constraint from the Phase 2 migration — a bare `ON CONFLICT DO UPDATE` with no target column list will fail at runtime if D1 can't infer which constraint you mean.

## Next

- Previous: [Phase 7 — Combat & Progression](../phase-07-combat-progression/README.md)
- Next: [Phase 9 — Deploy & Wrap-up](../phase-09-deploy-wrapup/README.md)
