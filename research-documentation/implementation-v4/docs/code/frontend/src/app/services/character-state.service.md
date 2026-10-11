# services/character-state.service.ts

Code: [`character-state.service.ts`](../../../../../../frontend/src/app/services/character-state.service.ts)

The client-side store, built on signals, for the active character, inventory, and combat state. It's the single source the UI renders from.

<!-- anchors:start -->
Anchors (`character-state.service.ts`): `CharacterStateService:6`, `setCharacter():50`, `setInventory():55`, `setCombatState():59`, `setCanLevelUp():64`, `clear():68`
<!-- anchors:end -->

## Key exports
| Member | Kind | Purpose |
|---|---|---|
| `character`, `inventory`, `combatState`, `inCombat`, `canLevelUp` | read-only signals | Current state |
| `hpPercent`, `xpPercent`, `xpToNext`, `modifiers` | computed | Values for display |
| `setCharacter(c)` | method | Also recomputes `canLevelUp` locally |
| `setInventory`, `setCombatState(state, inCombat)`, `setCanLevelUp`, `clear` | methods | Mutators |

## Rules & gotchas
- The server's response is the truth. Call the setters with `updatedCharacter` and `combatState` after every API call.
- `canLevelUp` is computed locally in `setCharacter`, then overwritten by the server's `canLevelUp` when a response includes it.
- `clear()` is never called. Switching campaigns relies on the next `setCharacter` overwriting the old state, so stale inventory can show briefly.
- The inventory component writes a **local-only** HP change here when a potion is used ([inventory.component.md](../components/inventory/inventory.component.md)).

## Connections
**Parents (used by):**
- [character-creation.component.md](../components/character-creation/character-creation.component.md)
- [character-sheet.component.md](../components/character-sheet/character-sheet.component.md)
- [game-console.component.md](../components/game-console/game-console.component.md)
- [inventory.component.md](../components/inventory/inventory.component.md)

**Children (uses):**
- [../models/game.models.md](../models/game.models.md): `Character`, `CombatState`, `InventoryEntry`, `XP_THRESHOLDS`
