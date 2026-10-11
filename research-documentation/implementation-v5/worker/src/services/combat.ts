import type { D1Database } from '@cloudflare/workers-types';
import type { Character, Monster, CombatState, SessionData, DiceRoll } from '../types/index.js';
import { attackRoll, rollExpression, modifier, roll } from './dice.js';

// ─── Select a level-appropriate monster ──────────────────────────────────────
export async function selectMonster(db: D1Database, characterLevel: number): Promise<Monster> {
  // Map level to CR range
  const crMax = Math.min(characterLevel * 0.75, 5);
  const crMin = Math.max(0.125, (characterLevel - 2) * 0.5);

  const result = await db.prepare(`
    SELECT * FROM monsters
    WHERE cr >= ? AND cr <= ?
    ORDER BY RANDOM() LIMIT 1
  `).bind(crMin, crMax).first<Monster>();

  if (!result) {
    // fallback to weakest
    return db.prepare('SELECT * FROM monsters ORDER BY cr ASC LIMIT 1').first<Monster>() as Promise<Monster>;
  }

  // Reset monster HP to full
  return { ...result, hp: result.max_hp };
}

// ─── Initialize combat ────────────────────────────────────────────────────────
export function initCombat(monster: Monster): CombatState {
  return {
    active: true,
    round: 1,
    monster: { ...monster, hp: monster.max_hp },
    playerTurn: true,
    log: [],
  };
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
  const diceRolls: DiceRoll[] = [];
  const monster = combatState.monster;
  let playerHpDelta = 0;
  let enemyHpDelta = 0;
  let playerAttack = null;
  let enemyAttack = null;
  let combatEnded = false;
  let victory = false;
  let xpGained = 0;
  const log: string[] = [];

  // ── Player turn ──────────────────────────────────────────────────────────
  if (playerAction === 'flee') {
    // Flee: DEX check DC 12
    const fleeRoll = roll(20) + modifier(character.dex);
    diceRolls.push({ type: 'd20+DEX', result: fleeRoll, reason: 'Flee attempt (DC 12)' });
    if (fleeRoll >= 12) {
      combatEnded = true;
      victory = false;
      log.push(`${character.name} successfully flees! (DEX check: ${fleeRoll})`);
    } else {
      log.push(`${character.name} fails to flee! (DEX check: ${fleeRoll} — needed 12)`);
    }
  } else if (playerAction === 'dodge') {
    // Dodge: impose disadvantage on next enemy attack
    log.push(`${character.name} takes the Dodge action.`);
  } else if (playerAction === 'attack') {
    // Determine player attack bonus
    const strMod = modifier(character.str);
    const dexMod = modifier(character.dex);
    const profBonus = Math.ceil(character.level / 4) + 1; // rough 5e proficiency

    const atkBonus = (character.class === 'Rogue' || character.class === 'Ranger')
      ? dexMod + profBonus
      : strMod + profBonus;

    const atk = attackRoll(atkBonus, monster.ac);
    diceRolls.push({ type: 'd20', result: atk.roll, reason: `Player attack vs ${monster.name} AC ${monster.ac}` });

    playerAttack = { roll: atk.roll, total: atk.total, hit: atk.hit, crit: atk.crit, damage: 0 };

    if (atk.hit) {
      // Determine weapon damage — use class weapon
      const damageDice = getPlayerDamageDice(character.class);
      const dmgMod = (character.class === 'Wizard' || character.class === 'Bard')
        ? modifier(character.int)
        : strMod;

      let { total: dmg } = rollExpression(damageDice);
      dmg = Math.max(1, dmg + dmgMod);
      if (atk.crit) dmg *= 2;

      diceRolls.push({ type: damageDice, result: dmg, reason: `Player damage (${atk.crit ? 'CRIT!' : 'hit'})` });
      enemyHpDelta = -dmg;
      playerAttack.damage = dmg;

      log.push(`${character.name} attacks ${monster.name}: roll ${atk.roll}+${atkBonus}=${atk.total} → ${atk.crit ? 'CRITICAL HIT' : 'HIT'} for ${dmg} damage!`);
    } else {
      log.push(`${character.name} attacks ${monster.name}: roll ${atk.roll}+${atkBonus}=${atk.total} → MISS`);
    }
  }

  // Update monster HP
  const newMonsterHp = monster.hp + enemyHpDelta;

  // Check monster death
  if (newMonsterHp <= 0 && !combatEnded) {
    combatEnded = true;
    victory = true;
    xpGained = monster.xp_reward;
    log.push(`${monster.name} is defeated! ${character.name} gains ${xpGained} XP!`);
  }

  // ── Enemy turn (if still alive and combat not ended) ─────────────────────
  if (!combatEnded) {
    const dodgePenalty = playerAction === 'dodge' ? -5 : 0;
    const eAtk = attackRoll(monster.attack_bonus + dodgePenalty, character.ac);

    diceRolls.push({
      type: 'd20',
      result: eAtk.roll,
      reason: `${monster.name} attacks player AC ${character.ac}`,
    });

    enemyAttack = { roll: eAtk.roll, total: eAtk.total, hit: eAtk.hit, damage: 0 };

    if (eAtk.hit) {
      const { total: eDmg } = rollExpression(monster.damage_dice);
      diceRolls.push({ type: monster.damage_dice, result: eDmg, reason: `${monster.name} damage` });
      playerHpDelta = -eDmg;
      enemyAttack.damage = eDmg;
      log.push(`${monster.name} attacks ${character.name}: roll ${eAtk.roll}+${monster.attack_bonus}=${eAtk.total} → HIT for ${eDmg} damage!`);
    } else {
      log.push(`${monster.name} attacks ${character.name}: roll ${eAtk.roll}+${monster.attack_bonus}=${eAtk.total} → MISS`);
    }

    // Check player death
    if (character.hp + playerHpDelta <= 0) {
      combatEnded = true;
      victory = false;
      log.push(`${character.name} has fallen!`);
    }
  }

  // ── Context string for AI DM ─────────────────────────────────────────────
  const contextForDM = [
    `Round ${combatState.round} vs ${monster.name} (HP: ${Math.max(0, newMonsterHp)}/${monster.max_hp}, AC: ${monster.ac})`,
    ...log,
    victory ? `VICTORY — ${character.name} has slain ${monster.name}!` : '',
    !victory && combatEnded && playerAction !== 'flee' ? `DEFEAT — ${character.name} has been struck down.` : '',
    playerAction === 'flee' && combatEnded && !victory ? `FLED — ${character.name} escaped combat.` : '',
  ].filter(Boolean).join('\n');

  return {
    playerAttack,
    enemyAttack,
    playerHpDelta,
    enemyHpDelta,
    combatEnded,
    victory,
    xpGained,
    diceRolls,
    contextForDM,
  };
}

// ─── Generate loot from a monster ────────────────────────────────────────────
export async function rollLoot(
  db: D1Database,
  monster: Monster,
): Promise<{ itemId: number; name: string }[]> {
  if (!monster.loot_table_id) return [];

  const { results } = await db.prepare(`
    SELECT lt.item_id, lt.drop_chance, i.name
    FROM loot_tables lt
    JOIN items i ON lt.item_id = i.id
    WHERE lt.monster_id = ?
  `).bind(monster.id).all<{ item_id: number; drop_chance: number; name: string }>();

  const loot: { itemId: number; name: string }[] = [];
  for (const row of results) {
    if (Math.random() < row.drop_chance) {
      loot.push({ itemId: row.item_id, name: row.name });
    }
  }
  return loot;
}

// ─── Add loot to inventory ────────────────────────────────────────────────────
export async function grantLoot(
  db: D1Database,
  characterId: string,
  loot: { itemId: number }[],
): Promise<void> {
  if (loot.length === 0) return;
  const stmts = loot.map(l =>
    db.prepare(`
      INSERT INTO character_inventory (character_id, item_id, quantity, equipped)
      VALUES (?, ?, 1, 0)
      ON CONFLICT DO UPDATE SET quantity = quantity + 1
    `).bind(characterId, l.itemId)
  );
  await db.batch(stmts);
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
