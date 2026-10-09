# Bugs

Defects found while writing the component docs in `research-documentation-v1/`. Every bug below exists in `complete/`, `research-documentation-v1/`, `research-documentation-v2/`, `research-documentation-v3/`, `research-documentation-v4/`, `research-documentation-v5/`, `research-documentation-v6/`, and `workshop/` (see [Workshop locations](#workshop-locations)); the logic is the same everywhere. **"Where" paths and line numbers in each entry are relative to `research-documentation-v1/`.** Line numbers in Angular component files differ in `complete/`, where templates and styles are still inline. None have been fixed.

When you fix a bug, fix it in **every** copy: `complete/`, `research-documentation-v1/`, `research-documentation-v2/`, `research-documentation-v3/`, `research-documentation-v4/`, `research-documentation-v5/`, `research-documentation-v6/`, `workshop/complete-reference/`, and the phase `solution/` files. In the workshop, also fix any `starter/` TODO that tells attendees to write the bug, and any README text that describes it as correct. Then delete the entry and update the **Rules & gotchas** in the component docs it links to. If you fix it in only some copies, say which ones in the entry instead of deleting it.

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
| B-14 | Medium | Inventory dialog opens at the bottom of the page, not centered over the content |

---

**B-01: Loot never drops**
- **Where:** `worker/src/services/combat.ts:186`, `worker/src/db/seed.sql` (monsters insert)
- **Cause:** `rollLoot` returns `[]` when `monster.loot_table_id` is null, and every seeded monster has `NULL`. The `loot_tables` rows (Goblin, Skeleton, Orc) are joined on `monster_id` and are never reached.
- **Fix idea:** drop the `loot_table_id` guard and query `loot_tables` by `monster_id`, or seed `loot_table_id`.
- **Docs:** [combat service](research-documentation-v1/worker/src/services/combat.md), [seed](research-documentation-v1/worker/src/db/seed.md)

**B-02: Buying from a shop fails**
- **Where:** `worker/src/routes/shop.ts:73`
- **Cause:** `ON CONFLICT(character_id, item_id)` needs a UNIQUE index on those columns, and `character_inventory` doesn't have one ([schema](research-documentation-v1/worker/migrations/0001_initial_schema.md)). SQLite rejects the statement, so the whole batch fails.
- **Fix idea:** add a migration with `CREATE UNIQUE INDEX … ON character_inventory(character_id, item_id)` (merge duplicates first).
- **Docs:** [shop route](research-documentation-v1/worker/src/routes/shop.md). No UI calls the shop yet.

**B-03: Secondary AI calls always fall back**
- **Where:** `worker/src/services/ai-dm.ts:252`, `:297`, `:324`
- **Cause:** `generateQuest`, `generateBackstory`, and `generateLevelUpNarrative` read only `response.response`. llama-3.3 returns `choices[0].message.content` ([DEPLOYMENT_NOTES §6](research-documentation-v1/docs/DEPLOYMENT_NOTES.md#6-workers-ai--model-deprecation)). `askDM` was fixed for this and these three weren't.
- **Fix idea:** pull the dual-format extraction in `askDM` out into a shared helper.
- **Docs:** [ai-dm service](research-documentation-v1/worker/src/services/ai-dm.md)

**B-04: Combat "Use Item" does nothing**
- **Where:** `frontend/.../game-console.component.html:89` and `.ts:144` (no `itemId` sent), `worker/src/services/combat.ts` (no `use_item` branch)
- **Cause:** the action is accepted, the monster still attacks, and no item is consumed or applied.
- **Docs:** [combat route](research-documentation-v1/worker/src/routes/combat.md), [game console](research-documentation-v1/frontend/src/app/components/game-console/game-console.component.md)

**B-05: Potion healing isn't saved**
- **Where:** `frontend/.../inventory.component.ts:111-121` (`usePotion`)
- **Cause:** the heal dice are rolled in the browser and HP is set only in `CharacterStateService`. The Worker removes the potion but never changes HP, and the next server response overwrites it. This also breaks the rule that the Worker owns all dice.
- **Fix idea:** add a Worker endpoint (or a `use_item` path) that rolls the heal and saves HP.
- **Docs:** [inventory](research-documentation-v1/frontend/src/app/components/inventory/inventory.component.md)

**B-06: `activeQuest` is hard-coded**
- **Where:** `worker/src/routes/character.ts:82-83`
- **Cause:** `GET /api/character/:id` always queries quest `1` instead of the session's `activeQuestId`.
- **Docs:** [character route](research-documentation-v1/worker/src/routes/character.md)

**B-07: Expired sessions can't be resumed**
- **Where:** `worker/src/routes/session.ts:14`
- **Cause:** after 7 days without play the KV entry expires and the route returns 404 without calling `rebuildSession`, so the game console can't load. The other routes do rebuild.
- **Docs:** [session route](research-documentation-v1/worker/src/routes/session.md), [game console](research-documentation-v1/frontend/src/app/components/game-console/game-console.component.md)

**B-08: Equipment has no effect on combat**
- **Where:** `worker/src/services/combat.ts` (`getPlayerDamageDice`)
- **Cause:** damage comes from the class and AC comes from the character row. Equipped weapons and armor are display-only.
- **Docs:** [combat service](research-documentation-v1/worker/src/services/combat.md)

**B-09: Wrong starting item**
- **Where:** `worker/src/services/character.ts:66` and the other entries in `CLASS_STARTING_ITEMS`
- **Cause:** item `23` is Torches; Rations is `24`. Fighter, Wizard, Cleric, and Bard get Torches, while the code comments say Rations.
- **Docs:** [character service](research-documentation-v1/worker/src/services/character.md), [seed](research-documentation-v1/worker/src/db/seed.md)

**B-10: Death doesn't end the game**
- **Where:** `worker/src/routes/combat.ts:110`, `frontend/.../game-console.component.ts:164`
- **Cause:** HP stays at 0, a message is shown, and input stays enabled. Nothing locks or resets the character.
- **Docs:** [game console](research-documentation-v1/frontend/src/app/components/game-console/game-console.component.md)

**B-11: Out-of-date config comment**
- **Where:** `frontend/wrangler.toml:12`
- **Cause:** it says to set `NG_APP_API_URL`, but the API URL comes from `environment.prod.ts`.
- **Docs:** [environment](research-documentation-v1/frontend/src/environments/environment.md)

**B-12: `grantLoot` upsert is dead code**
- **Where:** `worker/src/services/combat.ts:215`
- **Cause:** `ON CONFLICT DO UPDATE` has no target, and the only unique key is the autoincrement `id`, so it always inserts a new row. Once B-01 is fixed, repeated loot creates duplicate inventory rows. The B-02 index fix also fixes this.
- **Docs:** [combat service](research-documentation-v1/worker/src/services/combat.md)

**B-13: Equip query alias (unverified)**
- **Where:** `worker/src/routes/character.ts:116`
- **Cause:** `UPDATE character_inventory ci SET …` may be rejected by SQLite's `UPDATE` grammar. Test `PATCH /api/character/:id/equip` with a weapon or armor that's already equipped.
- **Docs:** [character route](research-documentation-v1/worker/src/routes/character.md)

**B-14: Inventory dialog isn't centered as a modal**
- **Symptom:** clicking **Inventory** in the game console opens the dialog at the bottom of the page instead of centered over the other content with a backdrop.
- **Where:** `frontend/src/styles.scss:23-25` (theme setup), and `openInventory()` in `frontend/.../game-console.component.ts:237-244`
- **Likely cause:** `styles.scss` includes `mat.all-component-themes` but not `mat.core()`. In Angular Material 18, `mat.core()` brings in the CDK overlay styles (`.cdk-overlay-container` as `position: fixed`, the backdrop, and the centering pane). Without them, the overlay container renders as a plain block appended to the end of `<body>`. `html, body { overflow: hidden }` can then also push it partly off-screen. The `inv-dialog-panel` `panelClass` has no styles defined anywhere.
- **Fix idea:** add `@include mat.core();` to `styles.scss` (outside `:root`), or add `@angular/cdk/overlay-prebuilt.css` to `styles` in `angular.json`. Then confirm the dialog is centered with a backdrop. Any other `MatDialog`, `MatSnackBar`, `MatSelect`, or tooltip overlay is probably affected too.
- **Docs:** [game console](research-documentation-v1/frontend/src/app/components/game-console/game-console.component.md), [inventory](research-documentation-v1/frontend/src/app/components/inventory/inventory.component.md), [styles](research-documentation-v1/frontend/src/styles.md)

---

## Workshop locations

Every bug is also in `workshop/`. All paths below are relative to `workshop/`. `CR` = `complete-reference/`, `pNN` = `phase-NN-*/`.

How each bug got there:
- **Code**: the buggy code is already written in the file.
- **TODO**: a `starter/` comment tells attendees to write the buggy code.
- **README**: the phase walkthrough describes the bug as correct.

The **TODO** and **README** rows matter most: fixing only the solution code still leaves the workshop teaching the bug.

| ID | Code | TODO (starter) | README |
|---|---|---|---|
| B-01 | `CR/worker/src/services/combat.ts:186`, `CR/worker/src/db/seed.sql:61`, `p07/solution/.../services/combat.ts:186`, `p02/{starter:81,solution:61}/.../db/seed.sql` | `p07/starter/.../services/combat.ts:91` ("if `loot_table_id` is falsy, return []") | `p02/README.md:48` (`loot_table_id` described as optional) |
| B-02 | `CR/worker/src/routes/shop.ts:73`, `p08/solution/.../routes/shop.ts:73`; no unique index in `p02/*/worker/migrations/0001_initial_schema.sql` | `p08/starter/.../routes/shop.ts:63` | `p07/README.md:127` and `p08/README.md:105` claim the Phase 2 migration **has** the unique constraint; it doesn't |
| B-03 | `CR/worker/src/services/ai-dm.ts:250,296,323`, `p04/solution/...:250,296,323`, `p04/starter/...:240,285,311` (pre-written) | none | `p04/README.md:91` says the helpers follow "the exact same shape" as `askDM`, while `:162` says to always check both response shapes, which they don't |
| B-04 | `CR/.../game-console.component.html:89`, `p06/{starter,solution}/.../game-console.component.html:89`; no `use_item` branch in `CR` or `p07/solution` `services/combat.ts` | none | `p07/README.md:122` says the Use Item button "comes alive" |
| B-05 | `CR/.../inventory.component.ts:111`, `p06/{starter,solution}/.../inventory.component.ts:111` (pre-written in the starter), `p08/solution/.../inventory.component.ts:111` | `p08/starter/.../inventory.component.ts:88-100` (roll client-side, patch HP locally) | none |
| B-06 | `CR/worker/src/routes/character.ts:83`, `p03/solution/.../routes/character.ts:80` | `p03/starter/.../routes/character.ts:57-58` ("hardcoded to 1 for this phase") | none |
| B-07 | `CR/worker/src/routes/session.ts:14`, `p03/{starter,solution}/.../routes/session.ts:14` (pre-written) | none | none |
| B-08 | `CR/worker/src/services/combat.ts:98`, `p07/solution/.../services/combat.ts:98` | `p07/starter/.../services/combat.ts:61-68` (class damage dice) | none |
| B-09 | `CR/worker/src/services/character.ts:66`, `p03/solution/...:66`, `p03/starter/...:44` (pre-written) | none | none |
| B-10 | `CR/.../game-console.component.ts:165`, `p06/solution/.../game-console.component.ts:165` | `p06/starter/.../game-console.component.ts:115-118` (only add a message) | none |
| B-11 | `CR/frontend/wrangler.toml:12` | none | none |
| B-12 | `CR/worker/src/services/combat.ts:215`, `p07/solution/.../services/combat.ts:215` | `p07/starter/.../services/combat.ts:109` | `p07/README.md:127` (relies on the missing unique index) |
| B-13 | `CR/worker/src/routes/character.ts:116`, `p03/solution/...:113`, `p03/starter/...:91` (pre-written) | none | none |
| B-14 | `CR/frontend/src/styles.scss:24`, `p06/solution/frontend/src/styles.scss:24` | `p06/starter/frontend/src/styles.scss:29-32`: TODO 2 says to **replace `mat.core()`** with the theme, which removes the overlay styles | none (Phase 1's `styles.scss` correctly includes `mat.core()`, so the bug first appears in Phase 6) |
