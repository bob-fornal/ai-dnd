# Flow: combat

How a fight starts and how one round (Attack, Dodge, Use Item, Flee) is resolved, from button to database. **Code rolls every die; the AI only narrates the pre-resolved result.**

## Start of combat
1. A free-text action makes the AI set `combatInitiated: true` ([action-loop](action-loop.md)).
2. `worker/src/routes/action.ts:79-80` runs `selectMonster(db, level)`, a random monster with CR in `[max(0.125,(level-2)*0.5), min(level*0.75,5)]` (`services/combat.ts:6-25`), then `initCombat` (`:27`). It sets `session.inCombat = true`.
3. The UI swaps the text input for combat buttons (`game-console.component.html:81-95`) and shows the combat header with monster HP (`:37`).

## One round
| Step | Where | What happens |
|---|---|---|
| 1 | `game-console.component.html:83-92` → `.ts:144` `combatAction(action)` | Pushes a player entry and calls `GameApiService.resolveCombat` (`game-api.service.ts:50`) |
| 2 | `POST /api/combat/resolve`, `worker/src/routes/combat.ts:11` | Loads the character and session; 400 if not in combat |
| 3 | `routes/combat.ts:38` → `services/combat.ts:50` `resolveCombatRound` | **All mechanics**, below |
| 4 | `routes/combat.ts:51` | `updateCharacter`: HP clamped to 0..max, XP added on a victory |
| 5 | `routes/combat.ts:56-57` | On a victory, `rollLoot` + `grantLoot` (loot never drops: bug B-01) |
| 6 | `routes/combat.ts:68` | `askDM(..., result.contextForDM)` narrates the round |
| 7 | `routes/combat.ts:80-95` | Clears `combatState` if ended, else `round+1` and saves monster HP; `saveSession` |
| 8 | `routes/combat.ts:100-103` | Two `adventure_log` rows (player row prefixed `[Combat]`) |
| 9 | `game-console.component.ts:149-175` | Updates state; victory/fled/died messages; level-up prompt if `canLevelUp` |

## `resolveCombatRound` rules (`services/combat.ts`)
- **Attack** (`:81`): d20 + (DEX for Rogue/Ranger, else STR) + proficiency `ceil(level/4)+1` vs monster AC via `attackRoll` (`dice.ts:55`; nat 20 = crit, nat 1 = miss). Damage = class die (`getPlayerDamageDice`, `:222`: Fighter/Cleric/Bard 1d8, others 1d6) + mod (INT for Wizard/Bard), minimum 1, doubled on a crit. **Equipment is ignored** (B-08).
- **Dodge** (`:78`): the monster attacks at -5 (`:130`).
- **Flee** (`:67`): d20 + DEX ≥ 12 ends combat without victory.
- **Use Item**: no effect; the monster still attacks (B-04).
- Monster death at `:121` (XP = `monster.xp_reward`). Player death at `:152` (HP ≤ 0 ends combat in defeat; nothing locks the game, B-10).
- `contextForDM` (`:160`) is the round log the AI must narrate.

## Docs
[services/combat.md](../code/worker/src/services/combat.md) · [routes/combat.md](../code/worker/src/routes/combat.md) · [services/dice.md](../code/worker/src/services/dice.md) · [services/ai-dm.md](../code/worker/src/services/ai-dm.md) · [game-console](../code/frontend/src/app/components/game-console/game-console.component.md)
