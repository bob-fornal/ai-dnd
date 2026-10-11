# routes/action.ts

`POST /api/action` runs the main game loop for one free-form player action outside combat.

## Request / response
- **Body:** `{ sessionId, characterId, action }`. `action` is required; `<` and `>` are stripped and it's cut to 500 characters.
- **Response:** `{ narrative, gameStateChanges, suggestedActions, diceRolls, updatedCharacter, inCombat, combatState, canLevelUp }`
- **Errors:** 400 for bad input or when the player is in combat (`inCombat: true`), 404 if the character doesn't exist, 500 with `detail`.

## Flow
1. Load the character and session (rebuild from D1 if KV has expired).
2. Reject the action if `session.inCombat`; combat goes through [combat.md](combat.md).
3. Call `askDM`, then apply `hpDelta` (clamped 0..max), positive `xpGained`, and `goldDelta` (floor 0).
4. Add both turns to history and apply `locationChange` and `questUpdate`.
5. If `combatInitiated`, run `selectMonster` and `initCombat` and set `inCombat`.
6. Save the session and write both turns to `adventure_log`.

## Rules & gotchas
- The AI **can** change HP, XP, and gold here. This is the only place it does; the clamps keep it in bounds.
- `itemsAdded` and `itemsRemoved` from the AI are ignored and the inventory doesn't change.

## Connections
**Parents (used by):**
- [../index.md](../index.md): mounted at `/api/action`
- Called over HTTP by [game-api.service.md](../../../frontend/src/app/services/game-api.service.md) (`sendAction`)

**Children (uses):**
- [services/character.md](../services/character.md): `getCharacter`, `updateCharacter`, `shouldLevelUp`
- [services/session.md](../services/session.md): `loadSession`, `saveSession`, `appendHistory`, `rebuildSession`
- [services/ai-dm.md](../services/ai-dm.md): `askDM`
- [services/combat.md](../services/combat.md): `selectMonster`, `initCombat`
- [types/index.md](../types/index.md): `Env`, `ActionBody`
