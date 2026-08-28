import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import type {
  Character, ActionResponse, CombatResponse,
  LogEntry, CampaignSlot, InventoryEntry,
} from '../models/game.models';
import type { CharacterClass, Race, AbilityKey } from '../models/game.models';
import { environment } from '../../environments/environment';

// In dev, environment.apiUrl = 'http://localhost:8787'.
// In production, Angular's fileReplacements swaps environment.ts → environment.prod.ts
// at build time, so environment.apiUrl is the deployed Worker URL with no runtime env vars needed.
const API_BASE: string = environment.apiUrl;

// FOCUS FILE — this is a thin HttpClient wrapper: one method per Worker
// endpoint from PRD.md section 9 (API Specification). Every method signature
// below is final; your job is to fill in each body with the matching
// this.http.get/post/patch/delete call.

@Injectable({ providedIn: 'root' })
export class GameApiService {
  private http = inject(HttpClient);

  // ── Character ──────────────────────────────────────────────────────────────
  createCharacter(body: {
    name: string;
    race: Race;
    class: CharacterClass;
    abilityRollMethod: 'roll' | 'standard';
  }): Observable<{
    characterId: string;
    sessionId: string;
    character: Character;
    backstory: string;
    startNarrative: string;
  }> {
    // TODO: POST body to `${API_BASE}/api/character/create`
    return of(null as any);
  }

  getCharacter(id: string): Observable<{ character: Character; inventory: InventoryEntry[]; activeQuest: any }> {
    // TODO: GET `${API_BASE}/api/character/${id}`
    return of(null as any);
  }

  // ── Gameplay ───────────────────────────────────────────────────────────────
  sendAction(sessionId: string, characterId: string, action: string): Observable<ActionResponse> {
    // TODO: POST { sessionId, characterId, action } to `${API_BASE}/api/action`
    return of(null as any);
  }

  // ── Combat ─────────────────────────────────────────────────────────────────
  resolveCombat(
    sessionId: string,
    characterId: string,
    action: 'attack' | 'dodge' | 'flee' | 'use_item',
    itemId?: number,
  ): Observable<CombatResponse> {
    // TODO: POST { sessionId, characterId, action, itemId } to
    // `${API_BASE}/api/combat/resolve`
    return of(null as any);
  }

  // ── Session ────────────────────────────────────────────────────────────────
  getSession(sessionId: string): Observable<{ session: any; character: Character }> {
    // TODO: GET `${API_BASE}/api/session/${sessionId}`
    return of(null as any);
  }

  // ── Log ────────────────────────────────────────────────────────────────────
  getLog(sessionId: string, page = 0, limit = 20): Observable<{ entries: LogEntry[]; total: number; page: number }> {
    // TODO: GET `${API_BASE}/api/log/${sessionId}` with { page, limit } params
    return of(null as any);
  }

  // ── Level up ───────────────────────────────────────────────────────────────
  levelUp(sessionId: string, characterId: string, abilityChoice: AbilityKey): Observable<{
    narrative: string;
    updatedCharacter: Character;
    newLevel: number;
  }> {
    // TODO: POST { sessionId, characterId, abilityChoice } to `${API_BASE}/api/levelup`
    return of(null as any);
  }

  // ── Quests ─────────────────────────────────────────────────────────────────
  generateQuest(sessionId: string, characterId: string): Observable<{ quest: any }> {
    // TODO: POST { sessionId, characterId } to `${API_BASE}/api/quest/generate`
    return of(null as any);
  }

  // ── Inventory ──────────────────────────────────────────────────────────────
  getInventory(characterId: string): Observable<{ inventory: InventoryEntry[] }> {
    // TODO: GET `${API_BASE}/api/character/${characterId}` and map the
    // response down to just { inventory } (see the `map` import above)
    return of(null as any);
  }

  equipItem(characterId: string, itemId: number, equipped: boolean): Observable<{ success: boolean; inventory: InventoryEntry[] }> {
    // TODO: PATCH { itemId, equipped } to `${API_BASE}/api/character/${characterId}/equip`
    return of(null as any);
  }

  dropItem(characterId: string, itemId: number): Observable<{ success: boolean; inventory: InventoryEntry[] }> {
    // TODO: DELETE `${API_BASE}/api/character/${characterId}/inventory/${itemId}`
    return of(null as any);
  }

  // ── Shop ───────────────────────────────────────────────────────────────────
  getShop(shopId: number): Observable<{ shop: any; items: any[] }> {
    // TODO: GET `${API_BASE}/api/shop/${shopId}`
    return of(null as any);
  }

  shopTransaction(body: {
    sessionId: string;
    characterId: string;
    shopId: number;
    action: 'buy' | 'sell';
    itemId: number;
    quantity: number;
  }): Observable<{ success: boolean; updatedGold: number }> {
    // TODO: POST body to `${API_BASE}/api/shop/transaction`
    return of(null as any);
  }
}
