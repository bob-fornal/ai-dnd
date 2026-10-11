# routes/combat.ts

Code: [`combat.ts`](../../../../../worker/src/routes/combat.ts)

`POST /api/combat/resolve` plays one combat round: code resolves it, then the AI narrates it.

<!-- anchors:start -->
Anchors (`combat.ts`): `combatRoutes:8`
<!-- anchors:end -->

## Request / response
- **Body:** `{ sessionId, characterId, action: 'attack'|'dodge'|'flee'|'use_item', itemId? }`
- **Response:** `{ narrative, combatState, combatEnded, victory, playerDied, xpGained, loot, diceRolls, suggestedActions, updatedCharacter, canLevelUp, inCombat }`
- **Errors:** 400 for bad input or when the player isn't in combat, 404 if the character doesn't exist.

## Flow
1. `resolveCombatRound` does all the mechanics.
2. Persist HP (clamped 0..max) and XP on a victory.
3. On a victory, `rollLoot` and then `grantLoot`.
4. `askDM` narrates with `contextForDM`, using the updated HP.
5. If combat ended, clear `combatState`. Otherwise increment the round and save the monster's HP.
6. Save the session and log both turns (player turn prefixed `[Combat]`).

## Rules & gotchas
- `itemId` is accepted but never used, and `use_item` does nothing ([bugs.md B-04](../../../../../../../bugs.md)).
- When the player dies, HP is set to 0. Nothing resets or locks the character.
- There's no top-level try/catch, so errors fall through to the global 500 handler in [../index.md](../index.md).

## Connections
**Parents (used by):**
- [../index.md](../index.md): mounted at `/api/combat`
- Called over HTTP by [game-api.service.md](../../../frontend/src/app/services/game-api.service.md) (`resolveCombat`)

**Children (uses):**
- [services/combat.md](../services/combat.md): `resolveCombatRound`, `rollLoot`, `grantLoot`
- [services/character.md](../services/character.md): `getCharacter`, `updateCharacter`, `shouldLevelUp`
- [services/session.md](../services/session.md): `loadSession`, `saveSession`, `appendHistory`, `rebuildSession`
- [services/ai-dm.md](../services/ai-dm.md): `askDM`
- [types/index.md](../types/index.md): `Env`, `CombatActionBody`
