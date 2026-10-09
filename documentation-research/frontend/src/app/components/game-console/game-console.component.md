# game-console.component.ts

`app-game-console`, routed at `/game/:sessionId`. The main play screen, in three columns: character sidebar, narrative console, adventure log.

## Layout
| Area | Contents |
|---|---|
| Left | `<app-character-sheet>`, the Inventory button (opens a dialog), and the level-up ability picker when `canLevelUp` |
| Center | Combat header (monster HP), narrative entries, suggested-action chips, then either the **combat buttons** (Attack/Dodge/Use Item/Flee) or the **text input**, depending on `inCombat` |
| Right | Adventure log with "Load more" paging |

## Flow
- **Init:** read `sessionId`. If the router state has `startNarrative` (fresh character), show it. Then `getSession`, then `setCharacter`, then load inventory and log page 0.
- **`sendAction`:** `POST /api/action`, then push the narrative and update character, combat state, `canLevelUp`, and the campaign slot level.
- **`combatAction`:** `POST /api/combat/resolve`, then push the narrative plus a victory, fled, or died message.
- **`levelUp(key)`:** `POST /api/levelup`, then update the character and slot.
- **`loadMoreLog`:** fetches older pages and prepends them.

## Gotchas
- **Use Item** sends no `itemId`, and the Worker ignores it anyway ([bugs.md B-04](../../../../../bugs.md), [routes/combat](../../../../../worker/src/routes/combat.md)).
- On death it only shows a message. Input stays enabled and HP stays at 0 ([bugs.md B-10](../../../../../bugs.md)).
- Narrative entries live only in memory. A reload shows just the log sidebar and a "resumes" line.
- The log isn't refreshed after new actions; only "Load more" fetches.
- If the session has expired in KV, `getSession` returns 404 and the console can't load ([bugs.md B-07](../../../../../bugs.md), [routes/session](../../../../../worker/src/routes/session.md)).

## Connections
**Parents (used by):**
- [../../app.routes.md](../../app.routes.md): `game/:sessionId`
- Reached from [../login/login.component.md](../login/login.component.md) and [../character-creation/character-creation.component.md](../character-creation/character-creation.component.md)

**Children (uses):**
- [../character-sheet/character-sheet.component.md](../character-sheet/character-sheet.component.md): embedded
- [../inventory/inventory.component.md](../inventory/inventory.component.md): opened as a `MatDialog` with `InventoryDialogData`
- [../../services/game-api.service.md](../../services/game-api.service.md)
- [../../services/character-state.service.md](../../services/character-state.service.md)
- [../../services/auth.service.md](../../services/auth.service.md): `updateCampaign`
- [../../models/game.models.md](../../models/game.models.md): `LogEntry`, `CombatState`, `AbilityKey`
- Spec: [PRD §10](../../../../../PRD.md#10-uiux-requirements)
