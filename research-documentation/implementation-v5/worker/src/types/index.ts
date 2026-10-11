// ─── Cloudflare Bindings ────────────────────────────────────────────────────
export interface Env {
  AI: Ai;
  SESSION_KV: KVNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
}

// ─── Character ──────────────────────────────────────────────────────────────
export type Race = 'Human' | 'Elf' | 'Dwarf' | 'Halfling' | 'Orc' | 'Tiefling';
export type CharacterClass = 'Fighter' | 'Wizard' | 'Rogue' | 'Cleric' | 'Ranger' | 'Bard';

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Character {
  id: string;
  session_id: string;
  name: string;
  race: Race;
  class: CharacterClass;
  level: number;
  xp: number;
  hp: number;
  max_hp: number;
  ac: number;
  gold: number;
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  created_at: string;
  updated_at: string;
}

// ─── Items & Inventory ──────────────────────────────────────────────────────
export type ItemType = 'weapon' | 'armor' | 'potion' | 'misc';

export interface ItemEffect {
  damage?: string;       // e.g. "1d8"
  ac_bonus?: number;
  heal?: string;         // e.g. "2d4+2"
  attack_bonus?: number;
  damage_bonus?: number;
}

export interface Item {
  id: number;
  name: string;
  type: ItemType;
  effect: ItemEffect;
  value: number;
  weight: number;
}

export interface InventoryEntry {
  id: number;
  character_id: string;
  item_id: number;
  quantity: number;
  equipped: boolean;
  item?: Item;
}

// ─── Monsters ───────────────────────────────────────────────────────────────
export interface Monster {
  id: number;
  name: string;
  cr: number;
  hp: number;
  max_hp: number;
  ac: number;
  attack_bonus: number;
  damage_dice: string;   // e.g. "2d6+3"
  xp_reward: number;
  loot_table_id: number | null;
}

// ─── Combat State ────────────────────────────────────────────────────────────
export interface DiceRoll {
  type: string;    // e.g. "d20", "1d8+3"
  result: number;
  reason: string;
}

export interface CombatState {
  active: boolean;
  round: number;
  monster: Monster;
  playerTurn: boolean;
  log: string[];
}

// ─── Session (KV) ────────────────────────────────────────────────────────────
export interface HistoryTurn {
  role: 'player' | 'dm';
  content: string;
}

export interface SessionData {
  characterId: string;
  location: string;
  activeQuestId: number | null;
  activeQuestSummary: string;
  inCombat: boolean;
  combatState: CombatState | null;
  history: HistoryTurn[];
}

// ─── AI DM Response ──────────────────────────────────────────────────────────
export interface GameStateChanges {
  hpDelta: number | null;
  xpGained: number | null;
  goldDelta: number | null;
  itemsAdded: string[];
  itemsRemoved: string[];
  locationChange: string | null;
  questUpdate: string | null;
  combatInitiated: boolean;
  combatEnded: boolean;
}

export interface AIDMResponse {
  narrative: string;
  gameStateChanges: GameStateChanges;
  suggestedActions: string[];
  diceRolls: DiceRoll[];
}

// ─── API Request/Response Bodies ─────────────────────────────────────────────
export interface CreateCharacterBody {
  name: string;
  race: Race;
  class: CharacterClass;
  abilityRollMethod: 'roll' | 'standard';
}

export interface ActionBody {
  sessionId: string;
  characterId: string;
  action: string;
}

export interface CombatActionBody {
  sessionId: string;
  characterId: string;
  action: 'attack' | 'dodge' | 'flee' | 'use_item';
  itemId?: number;
}

export interface ShopTransactionBody {
  sessionId: string;
  characterId: string;
  shopId: number;
  action: 'buy' | 'sell';
  itemId: number;
  quantity: number;
}

export interface LevelUpBody {
  sessionId: string;
  characterId: string;
  abilityChoice: keyof AbilityScores;
}

// ─── D&D Rule Constants ──────────────────────────────────────────────────────
export const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000
] as const; // indices 0-9 = level 1-10

export const STANDARD_ARRAY: AbilityScores = {
  str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8
};

export const CLASS_HIT_DICE: Record<CharacterClass, number> = {
  Fighter: 10,
  Wizard: 6,
  Rogue: 8,
  Cleric: 8,
  Ranger: 10,
  Bard: 8,
};

export const CLASS_STARTING_AC: Record<CharacterClass, number> = {
  Fighter: 16,
  Wizard: 11,
  Rogue: 13,
  Cleric: 14,
  Ranger: 13,
  Bard: 12,
};

export const RACE_BONUS: Record<Race, Partial<AbilityScores>> = {
  Human:    { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
  Elf:      { dex: 2, int: 1 },
  Dwarf:    { con: 2, str: 1 },
  Halfling: { dex: 2, cha: 1 },
  Orc:      { str: 2, con: 1 },
  Tiefling: { cha: 2, int: 1 },
};
