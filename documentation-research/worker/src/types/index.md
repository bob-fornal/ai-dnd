# types/index.ts

Shared TypeScript types and D&D rule constants for the Worker. The frontend keeps a hand-maintained mirror in [game.models.md](../../../frontend/src/app/models/game.models.md).

## Key exports
| Name | Kind | Purpose |
|---|---|---|
| `Env` | interface | Cloudflare bindings: `AI`, `SESSION_KV`, `DB`, `ENVIRONMENT` |
| `Race`, `CharacterClass`, `AbilityScores` | types | Character building blocks |
| `Character` | interface | Row shape of the `characters` table |
| `Item`, `ItemEffect`, `InventoryEntry` | interfaces | Items and inventory (`effect` is JSON in D1) |
| `Monster` | interface | Row shape of the `monsters` table |
| `DiceRoll`, `CombatState` | interfaces | Combat round data, stored inside the session |
| `HistoryTurn`, `SessionData` | interfaces | KV session document |
| `GameStateChanges`, `AIDMResponse` | interfaces | Contract the AI DM must return |
| `*Body` | interfaces | Request bodies for create, action, combat, shop, level-up |
| `XP_THRESHOLDS` | const | XP needed per level; index N is the threshold for reaching level N+1 |
| `STANDARD_ARRAY` | const | 15/14/13/12/10/8 |
| `CLASS_HIT_DICE`, `CLASS_STARTING_AC` | const | Per-class HP die and base AC |
| `RACE_BONUS` | const | Racial ability bonuses |

## Rules & gotchas
- Changing a type here usually means changing [game.models.md](../../../frontend/src/app/models/game.models.md) too. Nothing enforces the two copies matching.
- `Character` and `Monster` must match the columns in [0001_initial_schema.md](../../migrations/0001_initial_schema.md).
- `AIDMResponse` is described to the model as a schema string in [ai-dm.md](../services/ai-dm.md). Keep both in step.

## Connections
**Parents (used by):**
- [../index.md](../index.md)
- Every route: [action](../routes/action.md), [character](../routes/character.md), [combat](../routes/combat.md), [levelup](../routes/levelup.md), [log](../routes/log.md), [quest](../routes/quest.md), [session](../routes/session.md), [shop](../routes/shop.md)
- Every service: [ai-dm](../services/ai-dm.md), [character](../services/character.md), [combat](../services/combat.md), [session](../services/session.md)

**Children (uses):** none
