// ─── Shared Game Models ───────────────────────────────────────────────────────
// Mirror of the Worker types for the Angular frontend.
//
// FOCUS FILE — every exported interface/type below keeps its NAME so the rest
// of the app (services, components) can compile against it, but most bodies
// have been trimmed to just a couple of obvious fields.
//
// TODO: see PRD.md section 7 (Data Model) and section 9 (API Specification)
// for the full shape of each type, then fill in the missing fields.
// The complete version lives in the Phase 5 `solution/` folder if you get stuck.

export type Race = 'Human' | 'Elf' | 'Dwarf' | 'Halfling' | 'Orc' | 'Tiefling';
export type CharacterClass = 'Fighter' | 'Wizard' | 'Rogue' | 'Cleric' | 'Ranger' | 'Bard';
export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface Character {
  id: string;
  name: string;
  level: number;
  hp: number;
  max_hp: number;
  // TODO: see PRD.md section 7/9 for full shape (session_id, race, class, xp,
  // ac, gold, str/dex/con/int/wis/cha, created_at, updated_at).
}

export interface ItemEffect {
  damage?: string;
  // TODO: see PRD.md section 7/9 for full shape (ac_bonus, heal, attack_bonus,
  // damage_bonus, magic).
}

export interface Item {
  id: number;
  name: string;
  type: 'weapon' | 'armor' | 'potion' | 'misc';
  // TODO: see PRD.md section 7/9 for full shape (effect, value, weight).
}

export interface InventoryEntry {
  id: number;
  item_id: number;
  quantity: number;
  equipped: boolean;
  // TODO: see PRD.md section 7/9 for full shape (character_id, item?: Item).
}

export interface Monster {
  id: number;
  name: string;
  hp: number;
  max_hp: number;
  // TODO: see PRD.md section 7/9 for full shape (cr, ac, attack_bonus,
  // damage_dice, xp_reward).
}

export interface CombatState {
  active: boolean;
  round: number;
  monster: Monster;
  // TODO: see PRD.md section 7/9 for full shape (playerTurn, log).
}

export interface DiceRoll {
  type: string;
  result: number;
  // TODO: see PRD.md section 7/9 for full shape (reason).
}

export interface GameStateChanges {
  hpDelta: number | null;
  xpGained: number | null;
  // TODO: see PRD.md section 4.2 (F-09) for full shape (goldDelta, itemsAdded,
  // itemsRemoved, locationChange, questUpdate, combatInitiated, combatEnded).
}

export interface ActionResponse {
  narrative: string;
  updatedCharacter: Character;
  // TODO: see PRD.md section 9 for full shape (gameStateChanges,
  // suggestedActions, diceRolls, inCombat, combatState, canLevelUp).
}

export interface CombatResponse {
  narrative: string;
  updatedCharacter: Character;
  // TODO: see PRD.md section 9 for full shape (combatState, combatEnded,
  // victory, playerDied, xpGained, loot, diceRolls, suggestedActions,
  // canLevelUp, inCombat).
}

export interface LogEntry {
  id: number;
  actor: 'player' | 'dm' | 'system';
  content: string;
  // TODO: see PRD.md section 7/9 for full shape (created_at).
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
  location: string;
  // TODO: see PRD.md section 9/10 for full shape (characterId, lastPlayed).
  // Note: LoginComponent's campaign-slot list (kept complete in this phase)
  // reads several of these fields directly, which is why they stay here even
  // though this file is otherwise trimmed down.
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
