# Flow: inventory, equipment, potions, and shops

## Opening the inventory
- **Inventory** button `game-console.component.html:9` → `openInventory()` `game-console.component.ts:237`, which calls `MatDialog.open(InventoryComponent, { data, panelClass: 'inv-dialog-panel', maxHeight: '90vh' })` (`:242`).
- Data passed: `InventoryDialogData = { characterId, sessionId }` (`inventory.component.ts:19`), injected as `MAT_DIALOG_DATA`.
- The dialog opens at the bottom of the page because `styles.scss` lacks `mat.core()` (B-14).
- On init (`inventory.component.ts:53-70`) it calls `GameApiService.getInventory` (`game-api.service.ts:90`, which reuses `GET /api/character/:id`) and copies the result into `CharacterStateService.setInventory`.
- Tabs: All, Weapons, Armor, Consumables (potion + misc).

## Actions (API calls the dialog can make)
| UI action | Component | API → Worker | Effect |
|---|---|---|---|
| Load | `ngOnInit` `:53` | `getInventory` → `GET /api/character/:id` (`routes/character.ts:72`) | Inventory joined with `items`, `effect` parsed from JSON |
| Equip / unequip | `toggleEquip` `:72` | `equipItem` (`game-api.service.ts:96`) → `PATCH /api/character/:id/equip` (`routes/character.ts:93`) | Equipping a weapon or armor unequips others of the same type (`:114`). **Display only**: combat ignores equipment (B-08) |
| Use potion | `usePotion` `:96` | `dropItem` → `DELETE /api/character/:id/inventory/:itemId` | Heal dice rolled **in the browser** (`:110-121`); HP set locally only (`:129`), never saved (B-05) |
| Drop | `dropItem` `:144` | `dropItem` (`game-api.service.ts:100`) → `DELETE …/inventory/:itemId` (`routes/character.ts:137`) | `confirm()` first; removes one unit (`:149`) |

## Shops (Worker only; no UI yet)
- `GET /api/shop/:id` (`routes/shop.ts:8`) and `POST /api/shop/transaction` (`:27`): buy costs `value × qty` (checks gold and stock, `-1` = unlimited); sell pays `floor(value × 0.5) × qty`.
- **Buying fails**: `ON CONFLICT(character_id, item_id)` has no matching UNIQUE index (B-02).
- Seeded shops: 1 Aldric's Armory, 2 Rusty Flagon Store, 3 Wandering Merchant ([seed](../code/worker/src/db/seed.md)).

## Docs
[inventory](../code/frontend/src/app/components/inventory/inventory.component.md) · [game-console](../code/frontend/src/app/components/game-console/game-console.component.md) · [game-api.service](../code/frontend/src/app/services/game-api.service.md) · [routes/character.md](../code/worker/src/routes/character.md) · [routes/shop.md](../code/worker/src/routes/shop.md) · [styles](../code/frontend/src/styles.md)
