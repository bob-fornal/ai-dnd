/**
 * Server-side dice engine.
 * All random number generation happens here — never delegated to the AI.
 */

/** Roll a single die of `sides` faces. */
export function roll(sides: number): number {
  // TODO: return a random integer in the inclusive range [1, sides].
  // Hint: Math.floor(Math.random() * sides) + 1
  throw new Error('not implemented');
}

/**
 * Parse and roll a dice expression like "2d6+3", "1d8", "d20", "4d6".
 * Returns { total, rolls, modifier }.
 */
export function rollExpression(expr: string): { total: number; rolls: number[]; modifier: number } {
  // TODO:
  // 1. Match `expr` against /^(\d*)d(\d+)([+-]\d+)?$/ (case-insensitive) —
  //    throw new Error(`Invalid dice expression: ${expr}`) if it doesn't match.
  // 2. count = the first group, defaulting to 1 if omitted.
  // 3. sides = the second group.
  // 4. modifier = the third group (a signed integer), defaulting to 0.
  // 5. Roll `count` dice of `sides` faces each, collecting them in `rolls`.
  // 6. total = sum(rolls) + modifier, floored at 0 (never negative).
  throw new Error('not implemented');
}

/** Roll 4d6, drop the lowest — standard D&D ability score roll. */
export function roll4d6DropLowest(): number {
  // TODO: roll four d6, sort ascending, drop the lowest, sum the remaining three.
  throw new Error('not implemented');
}

/** Generate a full set of ability scores (4d6 drop lowest × 6). */
export function rollAbilityScores() {
  // TODO: call roll4d6DropLowest() once per ability and return
  // { str, dex, con, int, wis, cha }.
  throw new Error('not implemented');
}

/** Compute D&D 5e ability modifier: floor((score - 10) / 2). */
export function modifier(score: number): number {
  // TODO: return Math.floor((score - 10) / 2)
  throw new Error('not implemented');
}

/** Roll a D20 attack roll. Returns { roll, total, hit } vs a given AC. */
export function attackRoll(attackBonus: number, targetAC: number) {
  // TODO:
  // - Roll a d20.
  // - total = d20 + attackBonus.
  // - crit = natural 20, fumble = natural 1.
  // - hit = crit, OR (not a fumble AND total >= targetAC).
  // Return { roll: d20, total, hit, crit, fumble }.
  throw new Error('not implemented');
}
