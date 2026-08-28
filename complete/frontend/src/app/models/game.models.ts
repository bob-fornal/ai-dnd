// ─── Shared Game Models ───────────────────────────────────────────────────────
// Mirror of the Worker types for the Angular frontend.

export type Race = 'Human' | 'Elf' | 'Dwarf' | 'Halfling' | 'Orc' | 'Tiefling';
export type CharacterClass = 'Fighter' | 'Wizard' | 'Rogue' | 'Cleric' | 'Ranger' | 'Bard';
export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

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

export interface ItemEffect {
  damage?: string;
  ac_bonus?: number;
  heal?: string;
  attack_bonus?: number;
  damage_bonus?: number;
  magic?: boolean;
}

export interface Item {
  id: number;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'misc';
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

export interface Monster {
  id: number;
  name: string;
  cr: number;
  hp: number;
  max_hp: number;
  ac: number;
  attack_bonus: number;
  damage_dice: string;
  xp_reward: number;
}

export interface CombatState {
  active: boolean;
  round: number;
  monster: Monster;
  playerTurn: boolean;
  log: string[];
}

export interface DiceRoll {
  type: string;
  result: number;
  reason: string;
}

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

export interface ActionResponse {
  narrative: string;
  gameStateChanges: GameStateChanges;
  suggestedActions: string[];
  diceRolls: DiceRoll[];
  updatedCharacter: Character;
  inCombat: boolean;
  combatState: CombatState | null;
  canLevelUp: boolean;
}

export interface CombatResponse {
  narrative: string;
  combatState: CombatState | null;
  combatEnded: boolean;
  victory: boolean;
  playerDied: boolean;
  xpGained: number;
  loot: { itemId: number; name: string }[];
  diceRolls: DiceRoll[];
  suggestedActions: string[];
  updatedCharacter: Character;
  canLevelUp: boolean;
  inCombat: boolean;
}

export interface LogEntry {
  id: number;
  actor: 'player' | 'dm' | 'system';
  content: string;
  created_at: string;
}

export interface UserProfile {
  username: string;
  campaigns: CampaignSlot[];
}

export interface CampaignSlot {
  slotId: string;
  characterName: string;
  characterClass: CharacterClass;
  characterRace: Race;
  level: number;
  sessionId: string;
  characterId: string;
  lastPlayed: string;
  location: string;
}

// XP thresholds indexed by level (index = level, value = XP needed)
export const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000];

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};
