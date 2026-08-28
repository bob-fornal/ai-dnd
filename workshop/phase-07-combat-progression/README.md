# Phase 7 · Combat & Progression

**Duration:** 25 minutes (2:45 – 3:10)

---

## Learning Objectives

By the end of this phase you will be able to:

- Implement server-side combat resolution — attack rolls, damage rolls, and death checks — using the Phase 3 dice engine, with the AI never touching a single number.
- Extend the AI DM prompt pattern from Phase 4 with a "combat addendum" that narrates already-resolved mechanics instead of generating them (PRD 8.3).
- Select an encounter-appropriate monster from D1 by mapping character level to a Challenge Rating (CR) range.
- Implement a D&D 5e-style XP threshold table and a level-up flow that mutates a character and produces a narrative for it.
- See a UI you built two phases ago — the combat header, HP bars, and action buttons — come alive the instant its backend exists, with zero frontend changes.

## Prerequisites

- Phase 3 complete: `worker/src/services/dice.ts` (`roll`, `rollExpression`, `modifier`, `attackRoll`) and the character service exist and work.
- Phase 4 complete: `worker/src/services/ai-dm.ts` (`askDM`, `generateLevelUpNarrative`) exists and works.
- Phase 6 complete: `GameConsoleComponent` is wired up with a combat overlay (HP bars, Attack/Dodge/Use Item/Flee buttons) and a level-up panel that call `CharacterStateService` — you will not touch any frontend file this phase.
- `worker/src/routes/combat.ts`, `worker/src/routes/levelup.ts`, and `worker/src/services/combat.ts` exist as stubs (copy them from `starter/worker/src/...` into your project if you haven't already).

---

## Concepts

### 1. Deterministic combat math vs. AI narration — round two

Phase 4 established the app's core rule: the Worker computes, the AI narrates. Combat is the sharpest example of it. `resolveCombatRound()` in `services/combat.ts` is pure, synchronous TypeScript — a d20 roll against AC, weapon damage dice, HP deltas — with no AI call anywhere inside it. Only after the round is fully resolved does `routes/combat.ts` hand the *results* to `askDM()` as a `contextForDM` string built from the PRD 8.3 Combat Prompt Addendum:

```
Player attack result: {playerRoll} vs AC {enemyAc} → {hit/miss}
Player damage: {damage}
...
Narrate the round vividly. Do not re-roll or contradict these numbers.
```

The AI is told what happened and asked to make it sound exciting — never asked to decide what happened. This is why combat is fair and reproducible even though the prose changes every time.

### 2. CR-based monster selection

`selectMonster()` maps a character's level to a CR window (`crMax = min(level * 0.75, 5)`, `crMin = max(0.125, (level - 2) * 0.5)`) and picks a random D1 `monsters` row inside it (PRD F-14). A level 1 character can't accidentally pull a CR 5 dragon, and a level 8 character won't keep fighting CR 0.25 rats — the range scales with both ends as the party grows.

### 3. The D&D 5e XP threshold table (PRD 4.7 / F-28)

Leveling isn't based on "kill N monsters" — it's cumulative XP against a fixed table (`XP_THRESHOLDS` in `types/index.ts`: 0, 300, 900, 2700, 6500, … up to 64,000 at level 10, the MVP's max level per F-30). `shouldLevelUp()` compares a character's current XP against the threshold for `level + 1`; `levelUp()` then increases HP by the class's hit die, applies one ability score improvement the player chose, and bumps `level`. The narrative for *why* the character feels stronger is AI-generated (F-29) — the stat changes themselves are not.

### 4. Combat state lives in two places, on purpose

Consistent with the KV/D1 split from Phase 3 — `combatState` (round number, monster HP, whose turn it is) lives in the **session's KV blob**, because it's hot, ephemeral, per-encounter data. The permanent *outcome* of combat (character HP/XP after the fight, loot in `character_inventory`, log entries) is written to **D1**, because it must survive a KV TTL expiry or a session that gets rebuilt from scratch (F-22, F-23).

---

## Step-by-Step

1. Open `starter/worker/src/services/combat.ts`. Read the whole file first — the `CombatRoundResult` interface and the class-weapon-dice lookup table are already complete; everything else is a `TODO`.
2. Implement `selectMonster()`: compute the CR window, query D1, fall back to the weakest monster if nothing matches, and reset `hp` to `max_hp` on the row you return.
3. Implement `initCombat()`: return a fresh `CombatState` with `round: 1`, `playerTurn: true`, an empty log, and the monster at full HP.
4. Implement `resolveCombatRound()` — the core of the phase. Work through it action by action (`flee`, `dodge`, `attack`), using `roll`/`rollExpression`/`modifier`/`attackRoll` from `../services/dice.js` for every random number. Then handle the monster-death check, the enemy's turn, the player-death check, and finally build the `contextForDM` string.
5. Implement `rollLoot()` and `grantLoot()`: read the `loot_tables` → `items` join for the monster, roll each row's `drop_chance`, and upsert winners into `character_inventory`.
6. Open `starter/worker/src/routes/combat.ts` and fill in the handler body in order: resolve the round → clamp and persist HP/XP → roll and grant loot on victory → call `askDM()` with the combat addendum → update session history/combat state → write two `adventure_log` rows → re-fetch the character and return the response shape.
7. Open `starter/worker/src/routes/levelup.ts` and fill in: guard on `shouldLevelUp()` → call `levelUp()` → call `generateLevelUpNarrative()` → log + update session history → return the response shape.
8. Wire it up: in your own `worker/src/index.ts`, add the `combatRoutes` and `levelUpRoutes` imports and mount them at `/api/combat` and `/api/levelup` — see `solution/worker/src/index.ts` for the exact diff against the Phase 4 starter (do not edit either `index.ts` directly; they're provided complete for reference).
9. Run the Checkpoint below.

If you get stuck on any single piece, the fully-implemented version of all three files is in `solution/worker/src/services/combat.ts`, `solution/worker/src/routes/combat.ts`, and `solution/worker/src/routes/levelup.ts` — copy just the function you're stuck on rather than the whole file, so you still get the reps on everything else.

## Code Walkthrough

- **`services/combat.ts`**
  - `selectMonster()` — CR-range D1 query with a weakest-monster fallback (F-14).
  - `initCombat()` — builds the initial `CombatState` stored in the session.
  - `resolveCombatRound()` — the mechanical resolver: handles all four player actions, computes hit/miss/damage for both sides, detects victory/death/flee, and returns everything (including `diceRolls` and `contextForDM`) the route needs.
  - `rollLoot()` / `grantLoot()` — probability-rolled loot drops (F-16), upserted into `character_inventory`.
- **`routes/combat.ts`**
  - Loads character + session (rebuilding from D1 if the KV session expired), and rejects the request if the player isn't actually `inCombat`.
  - Calls `resolveCombatRound()`, applies the resulting HP/XP changes with clamping, then calls `askDM()` with the combat addendum — same `askDM()` from Phase 4, just a different prompt shape.
  - Persists session state (clearing `combatState` on combat end, or advancing the round) and writes both turns to `adventure_log` before responding, matching the "persist before you respond" discipline from Phase 4.
- **`routes/levelup.ts`**
  - Validates `abilityChoice` against the six ability score keys, guards on `shouldLevelUp()`, then delegates the actual stat math to the `character.ts` service (built in Phase 3) and the narrative to `ai-dm.ts` (Phase 4) — this route is mostly orchestration.

## Checkpoint

Start your Worker locally:

```bash
cd worker
npx wrangler dev
```

Trigger combat through `/api/action` first (an action like "I attack the goblin" should flip `session.inCombat` to `true` via the AI DM's `gameStateChanges.combatInitiated`), then resolve a round:

```bash
curl -X POST http://localhost:8787/api/combat/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "sess_test123",
    "characterId": "char_test123",
    "action": "attack"
  }'
```

Expected response shape:

```json
{
  "narrative": "string — the AI's account of the round",
  "combatState": { "active": true, "round": 2, "monster": { "...": "..." }, "playerTurn": true, "log": [] },
  "combatEnded": false,
  "victory": false,
  "playerDied": false,
  "xpGained": 0,
  "loot": [],
  "diceRolls": [{ "type": "d20", "result": 14, "reason": "Player attack vs Goblin AC 13" }],
  "suggestedActions": ["...", "...", "...", "..."],
  "updatedCharacter": { "...": "full character row" },
  "canLevelUp": false,
  "inCombat": true
}
```

Then, in the browser: create or resume a character, trigger combat through the game console's free-text input, and watch the Phase 6 combat header, enemy HP bar, and Attack/Dodge/Use Item/Flee buttons come alive — that UI has been sitting there since Phase 6 waiting for exactly this endpoint. Fight until victory or death, confirm loot/XP land, and if XP crosses a threshold, call `/api/levelup` (or use the level-up panel) and confirm HP increases and a narrative comes back.

## Common Pitfalls

- **`ON CONFLICT DO UPDATE` needs a unique index.** `grantLoot()`'s upsert (and Phase 8's shop upsert) only works if D1 has a unique constraint on `character_inventory(character_id, item_id)` from the Phase 2 schema migration — without it, SQLite has nothing to conflict on and you'll get duplicate rows per item instead of an incrementing `quantity`.
- **Forgetting to clamp HP.** `character.hp + result.playerHpDelta` can go negative, and healing/leveling can push it above `max_hp`. Always `Math.max(0, Math.min(max_hp, newHp))` before persisting.
- **Recomputing the attack bonus differently each place it's used.** The proficiency bonus formula (`Math.ceil(level / 4) + 1`) and the STR-vs-DEX class split (Rogue/Ranger use DEX, everyone else STR) need to match between the player's attack roll and anywhere else you might reference "the character's attack bonus" — keep it in one function if you extend this further.
- **Ending combat but forgetting to null out `combatState`.** If `result.combatEnded` is true and you only set `session.inCombat = false` without also clearing `session.combatState`, a stale monster (possibly at negative HP) can leak into the next fight.
- **Testing `/api/levelup` before the character actually has enough XP.** `shouldLevelUp()` will correctly reject it with a 400 — that's not a bug, seed some XP via combat wins first, or temporarily raise a test character's `xp` column directly in D1 for a faster checkpoint.

## Next

- Previous: [Phase 6 — Game Console UI](../phase-06-game-console-ui/README.md)
- Next: [Phase 8 — Economy & World](../phase-08-economy-world/README.md)
