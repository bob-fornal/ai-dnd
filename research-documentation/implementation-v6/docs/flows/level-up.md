# Flow: level-up

When the UI offers a level-up, what the player picks, and what changes on the character.

## When it is offered
- XP thresholds (`XP_THRESHOLDS`, `worker/src/types/index.ts:175`, mirrored in `game.models.ts:146`): **0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000**. Index N is the XP needed to reach level N+1; the maximum level is 10.
- The Worker decides: `shouldLevelUp(character)` (`services/character.ts:159`) is `xp >= XP_THRESHOLDS[level]` and `level < 10`. It is returned as `canLevelUp` by `POST /api/action` (`routes/action.ts:99`) and `POST /api/combat/resolve` (`routes/combat.ts:109`).
- The frontend also computes it in `CharacterStateService.setCharacter` → `checkLevelUp` (`character-state.service.ts:52,76`), then overwrites it with the server value (`game-console.component.ts:128,155`).
- UI: a banner in the character sheet (`character-sheet.component.html:66`) and an ability picker in the console sidebar (`game-console.component.html:19-28`). After combat, a system message prompts it (`game-console.component.ts:172`).

## Flow
| Step | Where | What happens |
|---|---|---|
| 1 | `game-console.component.html:24` → `.ts:183` `levelUp(key)` | Calls `GameApiService.levelUp(sessionId, characterId, abilityChoice)` (`game-api.service.ts:74`) |
| 2 | `POST /api/levelup`, `worker/src/routes/levelup.ts:10` | `abilityChoice` must be str/dex/con/int/wis/cha (`:23-25`); 400 if `!shouldLevelUp` (`:31`) |
| 3 | `services/character.ts:133` `levelUp` | Level +1; HP gain = `roll(class hit die) + CON mod` (`:141`), added to `max_hp` and current HP; **+2 to the chosen ability** (`:152`). AC is unchanged and scores aren't capped at 20 |
| 4 | `routes/levelup.ts:39-50` | Flavor text from `generateLevelUpNarrative` (usually fallback text, B-03), a `system` log row `[Level Up] …`, and a DM history turn |
| 5 | `game-console.component.ts:187-194` | `setCharacter`, `setCanLevelUp(false)`, system message, campaign slot level |

One level per call: a character with enough XP for two levels must call twice. Hit dice: Fighter/Ranger d10, Rogue/Cleric/Bard d8, Wizard d6 (`CLASS_HIT_DICE`).

## Docs
[routes/levelup.md](../code/worker/src/routes/levelup.md) · [services/character.md](../code/worker/src/services/character.md) · [types/index.md](../code/worker/src/types/index.md) · [character-state.service](../code/frontend/src/app/services/character-state.service.md) · [game-console](../code/frontend/src/app/components/game-console/game-console.component.md) · [character-sheet](../code/frontend/src/app/components/character-sheet/character-sheet.component.md)
