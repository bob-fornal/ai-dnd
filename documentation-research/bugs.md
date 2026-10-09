# Bugs

Defects found while writing the component docs. The code here is still identical to `../complete/`, so every bug below exists in both folders. None have been fixed.

When you fix a bug, delete its entry and update the **Gotchas** in the component docs it links to.

| ID | Severity | Summary |
|---|---|---|
| B-01 | High | Loot never drops |
| B-02 | High | Buying from a shop fails in SQL |
| B-03 | Medium | Quest, backstory, and level-up AI calls always return fallback text |
| B-04 | Medium | Combat "Use Item" does nothing |
| B-05 | Medium | Potion healing is never saved |
| B-06 | Low | `activeQuest` is always quest 1 |
| B-07 | Medium | Expired sessions can't be resumed |
| B-08 | Low | Equipment has no effect on combat |
| B-09 | Low | Starting gear gives Torches instead of Rations |
| B-10 | Low | Death doesn't end the game |
| B-11 | Low | Out-of-date config comment in `frontend/wrangler.toml` |
| B-12 | Low | `grantLoot` upsert can never update (latent duplicates) |
| B-13 | Unverified | Equip query uses a table alias in `UPDATE` |

---

**B-01: Loot never drops**
- **Where:** `worker/src/services/combat.ts:186`, `worker/src/db/seed.sql` (monsters insert)
- **Cause:** `rollLoot` returns `[]` when `monster.loot_table_id` is null, and every seeded monster has `NULL`. The `loot_tables` rows (Goblin, Skeleton, Orc) are joined on `monster_id` and are never reached.
- **Fix idea:** drop the `loot_table_id` guard and query `loot_tables` by `monster_id`, or seed `loot_table_id`.
- **Docs:** [combat service](worker/src/services/combat.md), [seed](worker/src/db/seed.md)

**B-02: Buying from a shop fails**
- **Where:** `worker/src/routes/shop.ts:73`
- **Cause:** `ON CONFLICT(character_id, item_id)` needs a UNIQUE index on those columns, and `character_inventory` doesn't have one ([schema](worker/migrations/0001_initial_schema.md)). SQLite rejects the statement, so the whole batch fails.
- **Fix idea:** add a migration with `CREATE UNIQUE INDEX … ON character_inventory(character_id, item_id)` (merge duplicates first).
- **Docs:** [shop route](worker/src/routes/shop.md). No UI calls the shop yet.

**B-03: Secondary AI calls always fall back**
- **Where:** `worker/src/services/ai-dm.ts:252`, `:297`, `:324`
- **Cause:** `generateQuest`, `generateBackstory`, and `generateLevelUpNarrative` read only `response.response`. llama-3.3 returns `choices[0].message.content` ([DEPLOYMENT_NOTES §6](docs/DEPLOYMENT_NOTES.md#6-workers-ai--model-deprecation)). `askDM` was fixed for this and these three weren't.
- **Fix idea:** pull the dual-format extraction in `askDM` out into a shared helper.
- **Docs:** [ai-dm service](worker/src/services/ai-dm.md)

**B-04: Combat "Use Item" does nothing**
- **Where:** `frontend/.../game-console.component.ts:469` (no `itemId` sent), `worker/src/services/combat.ts` (no `use_item` branch)
- **Cause:** the action is accepted, the monster still attacks, and no item is consumed or applied.
- **Docs:** [combat route](worker/src/routes/combat.md), [game console](frontend/src/app/components/game-console/game-console.component.md)

**B-05: Potion healing isn't saved**
- **Where:** `frontend/.../inventory.component.ts:396-406`
- **Cause:** the heal dice are rolled in the browser and HP is set only in `CharacterStateService`. The Worker removes the potion but never changes HP, and the next server response overwrites it. This also breaks the rule that the Worker owns all dice.
- **Fix idea:** add a Worker endpoint (or a `use_item` path) that rolls the heal and saves HP.
- **Docs:** [inventory](frontend/src/app/components/inventory/inventory.component.md)

**B-06: `activeQuest` is hard-coded**
- **Where:** `worker/src/routes/character.ts:82-83`
- **Cause:** `GET /api/character/:id` always queries quest `1` instead of the session's `activeQuestId`.
- **Docs:** [character route](worker/src/routes/character.md)

**B-07: Expired sessions can't be resumed**
- **Where:** `worker/src/routes/session.ts:14`
- **Cause:** after 7 days without play the KV entry expires and the route returns 404 without calling `rebuildSession`, so the game console can't load. The other routes do rebuild.
- **Docs:** [session route](worker/src/routes/session.md), [game console](frontend/src/app/components/game-console/game-console.component.md)

**B-08: Equipment has no effect on combat**
- **Where:** `worker/src/services/combat.ts` (`getPlayerDamageDice`)
- **Cause:** damage comes from the class and AC comes from the character row. Equipped weapons and armor are display-only.
- **Docs:** [combat service](worker/src/services/combat.md)

**B-09: Wrong starting item**
- **Where:** `worker/src/services/character.ts:66` and the other entries in `CLASS_STARTING_ITEMS`
- **Cause:** item `23` is Torches; Rations is `24`. Fighter, Wizard, Cleric, and Bard get Torches, while the code comments say Rations.
- **Docs:** [character service](worker/src/services/character.md), [seed](worker/src/db/seed.md)

**B-10: Death doesn't end the game**
- **Where:** `worker/src/routes/combat.ts:110`, `frontend/.../game-console.component.ts:489`
- **Cause:** HP stays at 0, a message is shown, and input stays enabled. Nothing locks or resets the character.
- **Docs:** [game console](frontend/src/app/components/game-console/game-console.component.md)

**B-11: Out-of-date config comment**
- **Where:** `frontend/wrangler.toml:12`
- **Cause:** it says to set `NG_APP_API_URL`, but the API URL comes from `environment.prod.ts`.
- **Docs:** [environment](frontend/src/environments/environment.md)

**B-12: `grantLoot` upsert is dead code**
- **Where:** `worker/src/services/combat.ts:215`
- **Cause:** `ON CONFLICT DO UPDATE` has no target, and the only unique key is the autoincrement `id`, so it always inserts a new row. Once B-01 is fixed, repeated loot creates duplicate inventory rows. The B-02 index fix also fixes this.
- **Docs:** [combat service](worker/src/services/combat.md)

**B-13: Equip query alias (unverified)**
- **Where:** `worker/src/routes/character.ts:116`
- **Cause:** `UPDATE character_inventory ci SET …` may be rejected by SQLite's `UPDATE` grammar. Test `PATCH /api/character/:id/equip` with a weapon or armor that's already equipped.
- **Docs:** [character route](worker/src/routes/character.md)
