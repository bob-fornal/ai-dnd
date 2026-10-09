# inventory.component.ts

`app-inventory` is a dialog component that lists the character's items in tabs (All, Weapons, Armor, Consumables) with equip, use, and drop actions.

Files: `.ts`, `.html`, `.css`, `.spec.ts`

Tests (`.spec.ts`, Jasmine/Karma via `npm test`): creates; loads inventory on init and shares it with the state service; groups by type; renders items; closes. Equip, use, and drop are **not** tested.

## Key exports
| Name | Purpose |
|---|---|
| `InventoryComponent` | The dialog |
| `InventoryDialogData` | `{ characterId, sessionId }` passed as `MAT_DIALOG_DATA` |

## Behavior
- On open it loads the inventory and writes it to both the local signal and `CharacterStateService`.
- **Equip/Unequip** (weapon or armor): `PATCH equip`, then replaces the inventory with the server's.
- **Drop:** `confirm()`, then `DELETE` one unit.
- **Use Potion:** rolls the `heal` dice **in the browser**, calls `dropItem` to use one up, and sets HP **locally only**.

## Rules & gotchas
- Healing from a potion is never saved. The next server response overwrites HP ([bugs.md B-05](../../../../../../bugs.md)). It also breaks the rule that the Worker owns all dice.
- Only `heal` potions can be used; anything else shows "no direct use effect".
- The dialog opens at the bottom of the page instead of centered ([bugs.md B-14](../../../../../../bugs.md)).

## Connections
**Parents (used by):**
- [../game-console/game-console.component.md](../game-console/game-console.component.md): `MatDialog.open`

**Children (uses):**
- [../../services/game-api.service.md](../../services/game-api.service.md): `getInventory`, `equipItem`, `dropItem`
- [../../services/character-state.service.md](../../services/character-state.service.md): `character`, `setInventory`, `setCharacter`
- [../../models/game.models.md](../../models/game.models.md): `InventoryEntry`, `Item`
- Spec: [PRD §4.4](../../../../../PRD.md#44-inventory--economy)
