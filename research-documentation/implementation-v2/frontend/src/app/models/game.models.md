# models/game.models.ts

Frontend types: a hand-maintained mirror of the Worker types, plus UI-only models and constants.

<!-- anchors:start -->
Anchors (`game.models.ts`): `Race:4`, `CharacterClass:5`, `AbilityKey:6`, `Character:8`, `ItemEffect:30`, `Item:39`, `InventoryEntry:48`, `Monster:57`, `CombatState:69`, `DiceRoll:77`, `GameStateChanges:83`, `ActionResponse:95`, `CombatResponse:106`, `LogEntry:121`, `UserProfile:128`, `CampaignSlot:133`, `XP_THRESHOLDS:146`, `ABILITY_LABELS:148`
<!-- anchors:end -->

## Key exports
| Name | Kind | Notes |
|---|---|---|
| `Race`, `CharacterClass`, `AbilityKey` | types | Same as the Worker |
| `Character`, `Item`, `ItemEffect`, `InventoryEntry`, `Monster`, `CombatState`, `DiceRoll`, `GameStateChanges` | interfaces | Mirror the Worker. `ItemEffect` adds `magic`; `Monster` leaves out `loot_table_id` |
| `ActionResponse` | interface | Response of `POST /api/action` |
| `CombatResponse` | interface | Response of `POST /api/combat/resolve` |
| `LogEntry` | interface | One row from `GET /api/log` |
| `UserProfile`, `CampaignSlot` | interfaces | **Frontend only**: stored in localStorage by [auth.service.md](../services/auth.service.md) |
| `XP_THRESHOLDS` | const | Must match the Worker's copy |
| `ABILITY_LABELS` | const | Full ability names for tooltips |

## Rules & gotchas
- When an API response or Worker type changes, update this file **and** [worker types](../../../../worker/src/types/index.md) together.

## Connections
**Parents (used by):**
- Services: [auth.service](../services/auth.service.md), [character-state.service](../services/character-state.service.md), [game-api.service](../services/game-api.service.md)
- Components: [login](../components/login/login.component.md), [character-creation](../components/character-creation/character-creation.component.md), [character-sheet](../components/character-sheet/character-sheet.component.md), [game-console](../components/game-console/game-console.component.md), [inventory](../components/inventory/inventory.component.md)

**Children (uses):** none
- Mirrors: [worker/src/types/index.md](../../../../worker/src/types/index.md)
