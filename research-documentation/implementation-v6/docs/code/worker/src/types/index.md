# types/index.ts

Code: [`index.ts`](../../../../../worker/src/types/index.ts)

Shared TypeScript types and D&D rule constants for the Worker. The frontend keeps a hand-maintained mirror in [game.models.md](../../../frontend/src/app/models/game.models.md).

<!-- anchors:start -->
Anchors (`index.ts`): `Env:2`, `Race:10`, `CharacterClass:11`, `AbilityScores:13`, `Character:22`, `ItemType:45`, `ItemEffect:47`, `Item:55`, `InventoryEntry:64`, `Monster:74`, `DiceRoll:88`, `CombatState:94`, `HistoryTurn:103`, `SessionData:108`, `GameStateChanges:119`, `AIDMResponse:131`, `CreateCharacterBody:139`, `ActionBody:146`, `CombatActionBody:152`, `ShopTransactionBody:159`, `LevelUpBody:168`, `XP_THRESHOLDS:175`, `STANDARD_ARRAY:179`, `CLASS_HIT_DICE:183`, `CLASS_STARTING_AC:192`, `RACE_BONUS:201`
<!-- anchors:end -->

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
| `XP_THRESHOLDS` | const | `0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000`; index N is the XP needed to reach level N+1 (max level 10) |
| `STANDARD_ARRAY` | const | 15/14/13/12/10/8 |
| `CLASS_HIT_DICE`, `CLASS_STARTING_AC` | const | Fighter d10/16, Wizard d6/11, Rogue d8/13, Cleric d8/14, Ranger d10/13, Bard d8/12 (hit die / base AC) |
| `RACE_BONUS` | const | Human +1 all; Elf +2 DEX +1 INT; Dwarf +2 CON +1 STR; Halfling +2 DEX +1 CHA; Orc +2 STR +1 CON; Tiefling +2 CHA +1 INT |

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
