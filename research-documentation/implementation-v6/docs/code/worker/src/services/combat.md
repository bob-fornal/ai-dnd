# services/combat.ts

Code: [`combat.ts`](../../../../../worker/src/services/combat.ts)

The deterministic combat engine. It resolves a full round (player, then monster) in code and produces a text summary for the AI to narrate.

<!-- anchors:start -->
Anchors (`combat.ts`): `selectMonster:6`, `initCombat:27`, `CombatRoundResult:38`, `resolveCombatRound:50`, `rollLoot:182`, `grantLoot:205`
<!-- anchors:end -->

## Key exports
| Name | Purpose |
|---|---|
| `selectMonster(db, level)` | Random monster with CR between `max(0.125, (level-2)*0.5)` and `min(level*0.75, 5)`. Falls back to the weakest |
| `initCombat(monster)` | New `CombatState`: round 1, monster at full HP |
| `resolveCombatRound(char, state, action)` | Returns `CombatRoundResult`: HP deltas, victory/end flags, XP, `diceRolls`, `contextForDM` |
| `rollLoot(db, monster)` | Rolls each `loot_tables` row against its `drop_chance` |
| `grantLoot(db, characterId, loot)` | Inserts the loot into `character_inventory` |

## Round rules
| Action | Effect |
|---|---|
| `attack` | d20 + (DEX for Rogue/Ranger, else STR) + proficiency `ceil(level/4)+1` vs monster AC. Damage = class die + mod (INT for Wizard/Bard), minimum 1, doubled on a crit |
| `dodge` | Monster attacks at -5 (an approximation of disadvantage) |
| `flee` | d20 + DEX vs DC 12; success ends combat with no victory |
| `use_item` | **No mechanical effect.** The monster still attacks |

- The monster attacks only if combat hasn't ended. If player HP would reach 0 or below, combat ends in defeat.
- Damage dice come from the class (`getPlayerDamageDice`), **not** the equipped weapon. Equipment has no effect on combat ([bugs.md B-08](../../../../../../../bugs.md)).

## Rules & gotchas
- `rollLoot` returns nothing when `monster.loot_table_id` is null, and every seeded monster has it null, so loot never drops ([bugs.md B-01](../../../../../../../bugs.md)).
- `resolveCombatRound` doesn't mutate state. The caller ([routes/combat.md](../routes/combat.md)) applies HP and round changes.

## Connections
**Parents (used by):**
- [routes/action.md](../routes/action.md): `selectMonster`, `initCombat`
- [routes/combat.md](../routes/combat.md): `resolveCombatRound`, `rollLoot`, `grantLoot`

**Children (uses):**
- [dice.md](dice.md): `attackRoll`, `rollExpression`, `modifier`, `roll`
- [types/index.md](../types/index.md): `Character`, `Monster`, `CombatState`, `DiceRoll`
- Tables: `monsters`, `loot_tables`, `items`, `character_inventory`
- Spec: [PRD §4.3](../../../../PRD.md#43-combat-system)
