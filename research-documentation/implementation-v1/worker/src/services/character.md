# services/character.ts

Character rules and persistence: creation, fetch, update, inventory reads, and leveling.

## Key exports
| Name | Purpose |
|---|---|
| `createCharacter(db, body, sessionId)` | Rolls scores or uses the standard array, applies racial bonus, sets HP/AC, inserts the row, grants starting gear |
| `getCharacter(db, id)` | One `characters` row or `null` |
| `updateCharacter(db, id, changes)` | Partial update of hp/xp/gold/level/max_hp/ac/abilities; bumps `updated_at` |
| `getInventory(db, characterId)` | Inventory joined with `items`; parses `effect` JSON, casts `equipped` to boolean |
| `levelUp(db, character, ability)` | +1 level, HP gain `roll(hitDie) + CON mod`, +2 to the chosen ability |
| `shouldLevelUp(character)` | `xp >= XP_THRESHOLDS[level]`, capped at level 10 |

## Rules & gotchas
- Level 1 HP = max hit die + CON modifier. Starting gold is 50.
- AC = class base AC, plus the DEX modifier for Rogues only.
- Starting gear (`CLASS_STARTING_ITEMS`) references seed item IDs **by number**.
- `updateCharacter` builds its SQL from the object's keys. Only pass the whitelisted fields its type allows.
- Item `23` is *Torches*, not *Rations* as the code comments say ([bugs.md B-09](../../../../../bugs.md)).
- `levelUp` doesn't touch AC and doesn't cap scores at 20.
- HP gain can be 0 or negative with a low CON.

## Connections
**Parents (used by):**
- [routes/character.md](../routes/character.md): create, get, inventory
- [routes/action.md](../routes/action.md), [routes/combat.md](../routes/combat.md): get, update, `shouldLevelUp`
- [routes/levelup.md](../routes/levelup.md): `levelUp`, `shouldLevelUp`
- [routes/quest.md](../routes/quest.md), [routes/session.md](../routes/session.md), [routes/shop.md](../routes/shop.md): get (shop also updates)

**Children (uses):**
- [dice.md](dice.md): `rollAbilityScores`, `roll`, `modifier`
- [types/index.md](../types/index.md): types and rule constants
- Tables: `characters`, `character_inventory`, `items` ([schema](../../migrations/0001_initial_schema.md))
- Spec: [PRD §4.1](../../../PRD.md#41-character-creation), [PRD §4.7](../../../PRD.md#47-level-progression)
