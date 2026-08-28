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
  // TODO:
  // 1. Generate a new id with crypto.randomUUID().
  // 2. Get base ability scores: rollAbilityScores() when
  //    body.abilityRollMethod === 'roll', otherwise { ...STANDARD_ARRAY }.
  // 3. Look up the racial bonus from RACE_BONUS[body.race] and add it to each
  //    of the six base scores to get the final `scores`.
  // 4. hitDie = CLASS_HIT_DICE[body.class]; conMod = modifier(scores.con);
  //    maxHp = hitDie + conMod (level 1 HP).
  // 5. ac = CLASS_STARTING_AC[body.class], with an extra + modifier(scores.dex)
  //    for Rogues.
  // 6. INSERT a row into `characters` with these values (see SQL hint below),
  //    starting level 1, xp 0, gold 50, hp == max_hp.
  // 7. Call grantStartingEquipment(db, id, body.class).
  // 8. Return getCharacter(db, id) — it will not be null right after insert.
  //
  // SQL hint:
  //   INSERT INTO characters
  //     (id, session_id, name, race, class, level, xp, hp, max_hp, ac, gold,
  //      str, dex, con, int, wis, cha, created_at, updated_at)
  //   VALUES (?,?,?,?,?,1,0,?,?,?,50,?,?,?,?,?,?,?,?)
  throw new Error('not implemented');
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
  // TODO: look up CLASS_STARTING_ITEMS[cls], build one prepared INSERT per
  // item, and run them together with db.batch(stmts).
  //
  // SQL hint:
  //   INSERT INTO character_inventory (character_id, item_id, quantity, equipped)
  //   VALUES (?, ?, 1, 0)
  throw new Error('not implemented');
}

// ─── Fetch Character ──────────────────────────────────────────────────────────
export async function getCharacter(db: D1Database, id: string): Promise<Character | null> {
  // TODO: SELECT * FROM characters WHERE id = ?, return the row or null.
  throw new Error('not implemented');
}

// ─── Update Character ─────────────────────────────────────────────────────────
export async function updateCharacter(
  db: D1Database,
  id: string,
  changes: Partial<Pick<Character, 'hp' | 'xp' | 'gold' | 'level' | 'max_hp' | 'ac' | 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>>
): Promise<void> {
  // TODO: build a dynamic `SET col = ?, col2 = ?, ...` clause from the keys
  // of `changes`, then:
  //   UPDATE characters SET <sets>, updated_at = datetime('now') WHERE id = ?
  throw new Error('not implemented');
}

// ─── Inventory ────────────────────────────────────────────────────────────────
export async function getInventory(db: D1Database, characterId: string): Promise<InventoryEntry[]> {
  // TODO: join character_inventory to items on item_id, filtered by
  // character_id, and map each row into an InventoryEntry with a nested
  // `item` object. Remember `effect` may come back as a JSON string that
  // needs JSON.parse.
  //
  // SQL hint:
  //   SELECT ci.*, i.name, i.type, i.effect, i.value, i.weight
  //   FROM character_inventory ci
  //   JOIN items i ON ci.item_id = i.id
  //   WHERE ci.character_id = ?
  throw new Error('not implemented');
}

// ─── Level Up ─────────────────────────────────────────────────────────────────
export async function levelUp(
  db: D1Database,
  character: Character,
  abilityChoice: keyof AbilityScores,
): Promise<Character> {
  // TODO (not needed until Phase 7 — Combat & Progression):
  // roll the class hit die + CON modifier for HP gain, bump the chosen
  // ability by 2, persist via updateCharacter, and return the refreshed
  // character.
  throw new Error('not implemented');
}

// ─── XP / Level Threshold ────────────────────────────────────────────────────
export function shouldLevelUp(character: Character): boolean {
  // TODO (not needed until Phase 7): compare character.xp against
  // XP_THRESHOLDS[character.level], capped at level 10.
  throw new Error('not implemented');
}
