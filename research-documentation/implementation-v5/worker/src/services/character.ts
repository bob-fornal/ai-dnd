import { type D1Database } from '@cloudflare/workers-types';
import type {
  Character, Race, CharacterClass,
  CreateCharacterBody, AbilityScores,
  InventoryEntry, Item,
} from '../types/index.js';
import {
  CLASS_HIT_DICE, CLASS_STARTING_AC, RACE_BONUS,
  STANDARD_ARRAY, XP_THRESHOLDS,
} from '../types/index.js';
import { rollAbilityScores, roll, modifier } from './dice.js';

// ─── Create Character ─────────────────────────────────────────────────────────
export async function createCharacter(
  db: D1Database,
  body: CreateCharacterBody,
  sessionId: string,
): Promise<Character> {
  const id = crypto.randomUUID();

  // Ability scores
  const base: AbilityScores =
    body.abilityRollMethod === 'roll'
      ? rollAbilityScores()
      : { ...STANDARD_ARRAY };

  // Apply racial bonuses
  const bonus = RACE_BONUS[body.race] ?? {};
  const scores: AbilityScores = {
    str: (base.str) + (bonus.str ?? 0),
    dex: (base.dex) + (bonus.dex ?? 0),
    con: (base.con) + (bonus.con ?? 0),
    int: (base.int) + (bonus.int ?? 0),
    wis: (base.wis) + (bonus.wis ?? 0),
    cha: (base.cha) + (bonus.cha ?? 0),
  };

  // HP = max hit die + CON modifier (level 1)
  const hitDie  = CLASS_HIT_DICE[body.class];
  const conMod  = modifier(scores.con);
  const maxHp   = hitDie + conMod;
  const ac      = CLASS_STARTING_AC[body.class] + (body.class === 'Rogue' ? modifier(scores.dex) : 0);

  const now = new Date().toISOString();

  await db.prepare(`
    INSERT INTO characters
      (id, session_id, name, race, class, level, xp, hp, max_hp, ac, gold,
       str, dex, con, int, wis, cha, created_at, updated_at)
    VALUES (?,?,?,?,?,1,0,?,?,?,50,?,?,?,?,?,?,?,?)
  `).bind(
    id, sessionId, body.name, body.race, body.class,
    maxHp, maxHp, ac,
    scores.str, scores.dex, scores.con, scores.int, scores.wis, scores.cha,
    now, now,
  ).run();

  // Grant starting equipment
  await grantStartingEquipment(db, id, body.class);

  return getCharacter(db, id) as Promise<Character>;
}

// ─── Starting Equipment ───────────────────────────────────────────────────────
const CLASS_STARTING_ITEMS: Record<CharacterClass, number[]> = {
  Fighter:  [2, 15, 17, 23], // Longsword, Shield, Potion, Rations
  Wizard:   [5, 26, 17, 23], // Quarterstaff, Spellbook, Potion, Rations
  Rogue:    [1, 3, 25, 17],  // Shortsword, Dagger, ThievesTools, Potion
  Cleric:   [9, 12, 17, 23], // Warhammer, ChainShirt, Potion, Rations
  Ranger:   [6, 11, 17, 22], // Shortbow, LeatherArmor, Potion, Rope
  Bard:     [8, 11, 17, 23], // Rapier, LeatherArmor, Potion, Rations
};

async function grantStartingEquipment(db: D1Database, characterId: string, cls: CharacterClass) {
  const itemIds = CLASS_STARTING_ITEMS[cls];
  const stmts = itemIds.map(itemId =>
    db.prepare(`
      INSERT INTO character_inventory (character_id, item_id, quantity, equipped)
      VALUES (?, ?, 1, 0)
    `).bind(characterId, itemId)
  );
  await db.batch(stmts);
}

// ─── Fetch Character ──────────────────────────────────────────────────────────
export async function getCharacter(db: D1Database, id: string): Promise<Character | null> {
  const result = await db.prepare(
    'SELECT * FROM characters WHERE id = ?'
  ).bind(id).first<Character>();
  return result ?? null;
}

// ─── Update Character ─────────────────────────────────────────────────────────
export async function updateCharacter(
  db: D1Database,
  id: string,
  changes: Partial<Pick<Character, 'hp' | 'xp' | 'gold' | 'level' | 'max_hp' | 'ac' | 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>>
): Promise<void> {
  const sets = Object.keys(changes).map(k => `${k} = ?`).join(', ');
  const values = Object.values(changes);
  await db.prepare(
    `UPDATE characters SET ${sets}, updated_at = datetime('now') WHERE id = ?`
  ).bind(...values, id).run();
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export async function getInventory(db: D1Database, characterId: string): Promise<InventoryEntry[]> {
  const { results } = await db.prepare(`
    SELECT ci.*, i.name, i.type, i.effect, i.value, i.weight
    FROM character_inventory ci
    JOIN items i ON ci.item_id = i.id
    WHERE ci.character_id = ?
  `).bind(characterId).all<InventoryEntry & Item>();

  return results.map(r => ({
    id: r.id,
    character_id: characterId,
    item_id: r.item_id,
    quantity: r.quantity,
    equipped: !!r.equipped,
    item: {
      id: r.item_id,
      name: r.name,
      type: r.type,
      effect: typeof r.effect === 'string' ? JSON.parse(r.effect) : r.effect,
      value: r.value,
      weight: r.weight,
    },
  }));
}

// ─── Level Up ─────────────────────────────────────────────────────────────────
export async function levelUp(
  db: D1Database,
  character: Character,
  abilityChoice: keyof AbilityScores,
): Promise<Character> {
  const newLevel = character.level + 1;
  const hitDie   = CLASS_HIT_DICE[character.class as CharacterClass];
  const conMod   = modifier(character.con);
  const hpGain   = roll(hitDie) + conMod;
  const newMaxHp = character.max_hp + hpGain;

  const abilityUpdate: Partial<Character> = {
    level: newLevel,
    hp: Math.min(character.hp + hpGain, newMaxHp),
    max_hp: newMaxHp,
  };

  // Bump chosen ability
  (abilityUpdate as Record<string, number>)[abilityChoice] =
    (character[abilityChoice] as number) + 2;

  await updateCharacter(db, character.id, abilityUpdate as Parameters<typeof updateCharacter>[2]);
  return getCharacter(db, character.id) as Promise<Character>;
}

// ─── XP / Level Threshold ────────────────────────────────────────────────────
export function shouldLevelUp(character: Character): boolean {
  if (character.level >= 10) return false;
  const threshold = XP_THRESHOLDS[character.level]; // level N threshold = index N
  return threshold !== undefined && character.xp >= threshold;
}
