/**
 * Server-side dice engine.
 * All random number generation happens here — never delegated to the AI.
 */

/** Roll a single die of `sides` faces. */
export function roll(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Parse and roll a dice expression like "2d6+3", "1d8", "d20", "4d6".
 * Returns { total, rolls, modifier }.
 */
export function rollExpression(expr: string): { total: number; rolls: number[]; modifier: number } {
  const match = expr.toLowerCase().match(/^(\d*)d(\d+)([+-]\d+)?$/);
  if (!match) throw new Error(`Invalid dice expression: ${expr}`);

  const count    = parseInt(match[1] || '1', 10);
  const sides    = parseInt(match[2]!, 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  const rolls: number[] = [];
  for (let i = 0; i < count; i++) rolls.push(roll(sides));

  const total = rolls.reduce((a, b) => a + b, 0) + modifier;
  return { total: Math.max(0, total), rolls, modifier };
}

/** Roll 4d6, drop the lowest — standard D&D ability score roll. */
export function roll4d6DropLowest(): number {
  const rolls = [roll(6), roll(6), roll(6), roll(6)].sort((a, b) => a - b);
  rolls.shift(); // drop lowest
  return rolls.reduce((a, b) => a + b, 0);
}

/** Generate a full set of ability scores (4d6 drop lowest × 6). */
export function rollAbilityScores() {
  return {
    str: roll4d6DropLowest(),
    dex: roll4d6DropLowest(),
    con: roll4d6DropLowest(),
    int: roll4d6DropLowest(),
    wis: roll4d6DropLowest(),
    cha: roll4d6DropLowest(),
  };
}

/** Compute D&D 5e ability modifier: floor((score - 10) / 2). */
export function modifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Roll a D20 attack roll. Returns { roll, total, hit } vs a given AC. */
export function attackRoll(attackBonus: number, targetAC: number) {
  const d20 = roll(20);
  const total = d20 + attackBonus;
  const crit = d20 === 20;
  const fumble = d20 === 1;
  return { roll: d20, total, hit: crit || (!fumble && total >= targetAC), crit, fumble };
}
