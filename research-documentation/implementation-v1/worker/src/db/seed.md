# db/seed.sql

Reference data for items, monsters, loot, quests, and shops. Run it with `npm run db:seed` (or `db:seed:local`) **after** the migration.

## IDs the code depends on
Rows get autoincrement IDs in insert order. **Reordering or adding rows in the middle breaks the code that uses these numbers.**

| IDs | Rows |
|---|---|
| Items 1–10 | Weapons: Shortsword, Longsword, Dagger, Handaxe, Quarterstaff, Shortbow, Greataxe, Rapier, Warhammer, Staff of Sparks |
| Items 11–16 | Armor: Leather, Chain Shirt, Scale Mail, Plate, Shield, Mage Robe |
| Items 17–21 | Potions: Healing, Greater Healing, Fire Breath, Antitoxin, Elixir of Health |
| Items 22–28 | Misc: Rope, Torches, Rations, Thieves Tools, Spellbook, Lucky Charm, Amulet of Protection |
| Monsters 1–13 | Giant Rat … Lich, CR 0.125–21 |
| Quests 1–5 | Stolen Amulet, Plague of the Undead, Dragon's Hoard, **Shadows in the Inn (4, the starter)**, Bandit King |
| Shops 1–3 | Aldric's Armory, Rusty Flagon Store, Wandering Merchant |

Code that uses these IDs:
- Starting gear: `CLASS_STARTING_ITEMS` in [services/character.md](../services/character.md)
- Starter quest `4`: `newSession` in [services/session.md](../services/session.md)
- Quest `1`: `GET /api/character/:id` in [routes/character.md](../routes/character.md)

## Rules & gotchas
- Every monster has `loot_table_id = NULL`, so the loot tables for Goblin, Skeleton, and Orc never fire ([bugs.md B-01](../../../../../bugs.md)).
- `damage_dice` must parse with `rollExpression` ([services/dice.md](../services/dice.md)).
- The seed isn't idempotent. Running it twice duplicates rows and shifts the IDs.
- Effect keys such as `magic`, `int_bonus`, and `advantage_once` are stored but no code reads them.

## Connections
**Parents (used by):**
- Wrangler `d1 execute` (scripts in `worker/package.json`)

**Children (uses):**
- [migrations/0001_initial_schema.md](../../migrations/0001_initial_schema.md): table definitions
