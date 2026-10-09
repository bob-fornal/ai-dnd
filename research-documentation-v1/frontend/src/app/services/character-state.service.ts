import { Injectable, signal, computed } from '@angular/core';
import type { Character, CombatState, InventoryEntry } from '../models/game.models';
import { XP_THRESHOLDS } from '../models/game.models';

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

  readonly hpPercent = computed(() => {
    const c = this._character();
    return c ? Math.round((c.hp / c.max_hp) * 100) : 100;
  });

  readonly xpPercent = computed(() => {
    const c = this._character();
    if (!c) return 0;
    const current  = XP_THRESHOLDS[c.level - 1] ?? 0;
    const next     = XP_THRESHOLDS[c.level]     ?? XP_THRESHOLDS[XP_THRESHOLDS.length - 1]!;
    const progress = c.xp - current;
    const total    = next - current;
    return total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 100;
  });

  readonly xpToNext = computed(() => {
    const c = this._character();
    if (!c || c.level >= 10) return 0;
    return (XP_THRESHOLDS[c.level] ?? 0) - c.xp;
  });

  readonly modifiers = computed(() => {
    const c = this._character();
    if (!c) return null;
    const mod = (v: number) => Math.floor((v - 10) / 2);
    return {
      str: mod(c.str), dex: mod(c.dex), con: mod(c.con),
      int: mod(c.int), wis: mod(c.wis), cha: mod(c.cha),
    };
  });

  setCharacter(character: Character): void {
    this._character.set(character);
    this._canLevelUp.set(this.checkLevelUp(character));
  }

  setInventory(inventory: InventoryEntry[]): void {
    this._inventory.set(inventory);
  }

  setCombatState(state: CombatState | null, inCombat: boolean): void {
    this._combatState.set(state);
    this._inCombat.set(inCombat);
  }

  setCanLevelUp(value: boolean): void {
    this._canLevelUp.set(value);
  }

  clear(): void {
    this._character.set(null);
    this._inventory.set([]);
    this._combatState.set(null);
    this._inCombat.set(false);
    this._canLevelUp.set(false);
  }

  private checkLevelUp(c: Character): boolean {
    if (c.level >= 10) return false;
    return c.xp >= (XP_THRESHOLDS[c.level] ?? Infinity);
  }
}
