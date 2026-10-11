# 0001_initial_schema.sql

Code: [`0001_initial_schema.sql`](../../../../worker/migrations/0001_initial_schema.sql)

The D1 (SQLite) schema. Apply it with `npm run db:migrate` (or `db:migrate:local`) from `worker/`.

## Tables
| Table | Key columns | Notes |
|---|---|---|
| `characters` | `id` TEXT PK, `session_id`, stats, `gold` (default 50) | Matches `Character` in [types](../src/types/index.md) |
| `items` | `id`, `name`, `type` (weapon/armor/potion/misc), `effect` JSON text | Reference data |
| `character_inventory` | `id` PK, `character_id` FK (cascade), `item_id`, `quantity`, `equipped` 0/1 | **No UNIQUE(character_id, item_id)** |
| `monsters` | `cr`, `hp`/`max_hp`, `ac`, `attack_bonus`, `damage_dice`, `xp_reward`, `loot_table_id` | Reference data |
| `loot_tables` | `monster_id`, `item_id`, `drop_chance` 0–1 | Joined on `monster_id` |
| `adventure_log` | `session_id`, `character_id`, `actor` (player/dm/system), `content`, `created_at` | Index on `(session_id, created_at DESC)` |
| `quests` | `level_min`, `level_max`, rewards | Reference data |
| `shops` / `shop_inventory` | PK `(shop_id, item_id)`, `stock` (-1 = unlimited) | Reference data |

## Rules & gotchas
- Reference tables are empty until you run [seed.md](../src/db/seed.md). See [DEPLOYMENT_NOTES §5](../../../DEPLOYMENT_NOTES.md#5-d1-database).
- `monsters.loot_table_id` references `loot_tables(id)`, but the code joins `loot_tables.monster_id` instead. The column only works as an on/off flag.
- Schema changes go in a **new** numbered migration. Don't edit this file.

## Connections
**Parents (used by):**
- [services/character.md](../src/services/character.md), [services/combat.md](../src/services/combat.md), [services/session.md](../src/services/session.md)
- Routes that query directly: [character](../src/routes/character.md), [action](../src/routes/action.md), [combat](../src/routes/combat.md), [levelup](../src/routes/levelup.md), [log](../src/routes/log.md), [quest](../src/routes/quest.md), [shop](../src/routes/shop.md)

**Children (uses):** none
- Spec: [PRD §7](../../../PRD.md#7-data-model)
