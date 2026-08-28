import { Injectable, signal, computed } from '@angular/core';
import type { Character, CombatState, InventoryEntry } from '../models/game.models';

// FOCUS FILE — this signal-based service is the single source of truth for
// "the current character" that every other component (character sheet, game
// console, inventory) reads from. The private signal fields and their public
// readonly/computed NAMES are final — your job is to wire up the real values.
//
// TODO: import XP_THRESHOLDS from '../models/game.models' once you need it
// for the xpPercent/xpToNext/checkLevelUp math below.

@Injectable({ providedIn: 'root' })
export class CharacterStateService {
  private _character = signal<Character | null>(null);
  private _inventory = signal<InventoryEntry[]>([]);
  private _combatState = signal<CombatState | null>(null);
  private _inCombat = signal(false);
  private _canLevelUp = signal(false);

  readonly character   = this._character.asReadonly();
  readonly inventory   = this._inventory.asReadonly();
  readonly combatState = this._combatState.asReadonly();
  readonly inCombat    = this._inCombat.asReadonly();
  readonly canLevelUp  = this._canLevelUp.asReadonly();

  // TODO: derive the HP bar percentage from `_character()` (hp / max_hp * 100).
  readonly hpPercent = computed(() => 100);

  // TODO: derive percent progress toward the next level using XP_THRESHOLDS
  // and `_character().level` / `_character().xp`.
  readonly xpPercent = computed(() => 0);

  // TODO: derive XP remaining until the next level (0 once level 10 is hit).
  readonly xpToNext = computed(() => 0);

  // TODO: derive D&D-style ability modifiers: Math.floor((score - 10) / 2)
  // for each of str/dex/con/int/wis/cha.
  readonly modifiers = computed<Record<string, number> | null>(() => null);

  setCharacter(character: Character): void {
    // TODO: set the character signal, then recompute canLevelUp via checkLevelUp()
  }

  setInventory(inventory: InventoryEntry[]): void {
    // TODO: set the inventory signal
  }

  setCombatState(state: CombatState | null, inCombat: boolean): void {
    // TODO: set both the combatState and inCombat signals
  }

  setCanLevelUp(value: boolean): void {
    // TODO: set the canLevelUp signal
  }

  clear(): void {
    // TODO: reset every signal back to its empty/default value (used on logout)
  }

  private checkLevelUp(c: Character): boolean {
    // TODO: return true when c.xp has crossed the threshold for c.level + 1
    // (and c.level is below the level-10 cap)
    return false;
  }
}
