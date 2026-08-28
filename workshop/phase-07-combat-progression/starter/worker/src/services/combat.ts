import type { D1Database } from '@cloudflare/workers-types';
import type { Character, Monster, CombatState, SessionData, DiceRoll } from '../types/index.js';
import { attackRoll, rollExpression, modifier, roll } from './dice.js';

// ─── Select a level-appropriate monster ──────────────────────────────────────
export async function selectMonster(db: D1Database, characterLevel: number): Promise<Monster> {
  // TODO: Map the character's level to a CR (Challenge Rating) range:
  //   crMax = Math.min(characterLevel * 0.75, 5)
  //   crMin = Math.max(0.125, (characterLevel - 2) * 0.5)
  // TODO: Query D1: SELECT * FROM monsters WHERE cr >= crMin AND cr <= crMax
  //   ORDER BY RANDOM() LIMIT 1.
  // TODO: If nothing matches, fall back to the single weakest monster
  //   (SELECT * FROM monsters ORDER BY cr ASC LIMIT 1).
  // TODO: Reset the returned monster's `hp` to `max_hp` before returning it — monster
  //   rows are shared/reused, so the row you read may carry damage from a past fight.
  throw new Error('selectMonster not implemented');
}

// ─── Initialize combat ────────────────────────────────────────────────────────
export function initCombat(monster: Monster): CombatState {
  // TODO: Return a fresh CombatState: { active: true, round: 1, playerTurn: true,
  //   log: [], monster: { ...monster, hp: monster.max_hp } }.
  throw new Error('initCombat not implemented');
}

// ─── Resolve one combat round ─────────────────────────────────────────────────
export interface CombatRoundResult {
  playerAttack: { roll: number; total: number; hit: boolean; crit: boolean; damage: number } | null;
  enemyAttack:  { roll: number; total: number; hit: boolean; damage: number } | null;
  playerHpDelta: number;
  enemyHpDelta:  number;
  combatEnded: boolean;
  victory: boolean;
  xpGained: number;
  diceRolls: DiceRoll[];
  contextForDM: string;
}

export function resolveCombatRound(
  character: Character,
  combatState: CombatState,
  playerAction: 'attack' | 'dodge' | 'flee' | 'use_item',
): CombatRoundResult {
  // This function is the heart of Phase 7: ALL combat math happens here, server-side.
  // The AI DM only narrates whatever numbers you compute below — it never rolls dice
  // itself (see routes/combat.ts and PRD 8.3, the Combat Prompt Addendum). Use
  // ../services/dice.js (built in Phase 3) for every random number:
  //
  //   roll(sides)                 — a single die, e.g. roll(20)
  //   rollExpression("1d8+3")     — a full damage expression → { total, rolls, modifier }
  //   modifier(score)             — D&D 5e ability modifier: floor((score - 10) / 2)
  //   attackRoll(bonus, targetAC) — d20 + bonus vs AC → { roll, total, hit, crit, fumble }
  //
  // TODO 'flee': fleeRoll = roll(20) + modifier(character.dex); success at >= 12 DC.
  //   On success: combatEnded = true, victory = false, and skip the enemy's turn
  //   entirely (record the flee roll in diceRolls either way).
  //
  // TODO 'dodge': no roll needed — just note it in the round log. It should impose a
  //   -5 penalty on the enemy's attack bonus this round (see the enemy-turn TODO).
  //
  // TODO 'attack':
  //   - attack bonus = (Rogue/Ranger ? modifier(character.dex) : modifier(character.str))
  //     + proficiency bonus (Math.ceil(character.level / 4) + 1)
  //   - call attackRoll(atkBonus, monster.ac); push a d20 entry onto diceRolls
  //   - on a hit, roll class/weapon damage with rollExpression(damageDice) — Fighter/
  //     Cleric/Bard = 1d8, Wizard/Rogue/Ranger = 1d6 — add STR mod (or INT mod for
  //     Wizard/Bard), floor at 1, and double the total on a crit
  //   - enemyHpDelta = -damage; push the damage roll onto diceRolls too
  //
  // TODO: Check for monster death: if monster.hp + enemyHpDelta <= 0 and combat hasn't
  //   already ended (e.g. via flee), set combatEnded = true, victory = true, and
  //   xpGained = monster.xp_reward.
  //
  // TODO: If combat still hasn't ended, resolve the enemy's turn the same way:
  //   attackRoll(monster.attack_bonus + dodgePenalty, character.ac), and on a hit
  //   rollExpression(monster.damage_dice) for damage → playerHpDelta. Check for player
  //   death: character.hp + playerHpDelta <= 0 → combatEnded = true, victory = false.
  //
  // TODO: Build `contextForDM` — a short plain-text summary of exactly what happened
  //   this round (attack rolls, hits/misses, damage, victory/defeat/flee). The combat
  //   route hands this straight to the AI DM prompt so the narrative can't contradict
  //   your numbers. See PRD 8.3 for the expected shape.
  throw new Error('resolveCombatRound not implemented');
}

// ─── Generate loot from a monster ────────────────────────────────────────────
export async function rollLoot(
  db: D1Database,
  monster: Monster,
): Promise<{ itemId: number; name: string }[]> {
  // TODO: If monster.loot_table_id is falsy, return [] — no loot table configured.
  // TODO: Otherwise SELECT lt.item_id, lt.drop_chance, i.name FROM loot_tables lt
  //   JOIN items i ON lt.item_id = i.id WHERE lt.monster_id = monster.id.
  // TODO: For each row, roll Math.random() < drop_chance to decide whether it drops;
  //   collect the winners as { itemId, name }.
  throw new Error('rollLoot not implemented');
}

// ─── Add loot to inventory ────────────────────────────────────────────────────
export async function grantLoot(
  db: D1Database,
  characterId: string,
  loot: { itemId: number }[],
): Promise<void> {
  // TODO: If loot is empty, return immediately.
  // TODO: For each dropped item, prepare an INSERT INTO character_inventory
  //   (character_id, item_id, quantity, equipped) VALUES (?, ?, 1, 0) that bumps
  //   `quantity` instead of duplicating a row when the character already has that item
  //   (ON CONFLICT DO UPDATE SET quantity = quantity + 1). Run them all with
  //   db.batch([...]).
}

// ─── Class weapon damage dice ─────────────────────────────────────────────────
function getPlayerDamageDice(cls: string): string {
  const map: Record<string, string> = {
    Fighter:  '1d8',
    Wizard:   '1d6',
    Rogue:    '1d6',
    Cleric:   '1d8',
    Ranger:   '1d6',
    Bard:     '1d8',
  };
  return map[cls] ?? '1d6';
}
