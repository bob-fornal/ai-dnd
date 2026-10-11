# services/dice.ts

The server-side dice engine. **All randomness for game rules happens here, never in the AI.**

<!-- anchors:start -->
Anchors (`dice.ts`): `roll:7`, `rollExpression:15`, `roll4d6DropLowest:31`, `rollAbilityScores:38`, `modifier:50`, `attackRoll:55`
<!-- anchors:end -->

## Key exports
| Name | Purpose |
|---|---|
| `roll(sides)` | One die, 1..sides |
| `rollExpression(expr)` | Parses `NdS±M` (`"2d6+3"`, `"d20"`). Returns `{ total, rolls, modifier }`; total is never below 0 |
| `roll4d6DropLowest()` | One ability score |
| `rollAbilityScores()` | Six scores using 4d6-drop-lowest |
| `modifier(score)` | 5e modifier: `floor((score - 10) / 2)` |
| `attackRoll(bonus, ac)` | d20 + bonus vs AC. Natural 20 always hits (`crit`), natural 1 always misses (`fumble`) |

## Rules & gotchas
- `rollExpression` throws on anything that doesn't match `^\d*d\d+([+-]\d+)?$`. Seed `damage_dice` values must stay in that format ([seed.md](../db/seed.md)).
- Uses `Math.random()`. That's fine for a game; don't reuse it for anything security-related.

## Connections
**Parents (used by):**
- [character.md](character.md): ability scores, HP rolls, modifiers
- [combat.md](combat.md): attack, damage, flee rolls

**Children (uses):** none
