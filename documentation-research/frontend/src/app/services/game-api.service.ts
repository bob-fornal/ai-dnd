import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
    return this.http.post<any>(`${API_BASE}/api/character/create`, body);
  }

  getCharacter(id: string): Observable<{ character: Character; inventory: InventoryEntry[]; activeQuest: any }> {
    return this.http.get<any>(`${API_BASE}/api/character/${id}`);
  }

  // ── Gameplay ───────────────────────────────────────────────────────────────
  sendAction(sessionId: string, characterId: string, action: string): Observable<ActionResponse> {
    return this.http.post<ActionResponse>(`${API_BASE}/api/action`, {
      sessionId,
      characterId,
      action,
    });
  }

  // ── Combat ─────────────────────────────────────────────────────────────────
  resolveCombat(
    sessionId: string,
    characterId: string,
    action: 'attack' | 'dodge' | 'flee' | 'use_item',
    itemId?: number,
  ): Observable<CombatResponse> {
    return this.http.post<CombatResponse>(`${API_BASE}/api/combat/resolve`, {
      sessionId, characterId, action, itemId,
    });
  }

  // ── Session ────────────────────────────────────────────────────────────────
  getSession(sessionId: string): Observable<{ session: any; character: Character }> {
    return this.http.get<any>(`${API_BASE}/api/session/${sessionId}`);
  }

  // ── Log ────────────────────────────────────────────────────────────────────
  getLog(sessionId: string, page = 0, limit = 20): Observable<{ entries: LogEntry[]; total: number; page: number }> {
    return this.http.get<any>(`${API_BASE}/api/log/${sessionId}`, {
      params: { page: String(page), limit: String(limit) },
    });
  }

  // ── Level up ───────────────────────────────────────────────────────────────
  levelUp(sessionId: string, characterId: string, abilityChoice: AbilityKey): Observable<{
    narrative: string;
    updatedCharacter: Character;
    newLevel: number;
  }> {
    return this.http.post<any>(`${API_BASE}/api/levelup`, {
      sessionId, characterId, abilityChoice,
    });
  }

  // ── Quests ─────────────────────────────────────────────────────────────────
  generateQuest(sessionId: string, characterId: string): Observable<{ quest: any }> {
    return this.http.post<any>(`${API_BASE}/api/quest/generate`, { sessionId, characterId });
  }

  // ── Inventory ──────────────────────────────────────────────────────────────
  getInventory(characterId: string): Observable<{ inventory: InventoryEntry[] }> {
    return this.http.get<{ character: any; inventory: InventoryEntry[]; activeQuest: any }>(
      `${API_BASE}/api/character/${characterId}`
    ).pipe(map(r => ({ inventory: r.inventory })));
  }

  equipItem(characterId: string, itemId: number, equipped: boolean): Observable<{ success: boolean; inventory: InventoryEntry[] }> {
    return this.http.patch<any>(`${API_BASE}/api/character/${characterId}/equip`, { itemId, equipped });
  }

  dropItem(characterId: string, itemId: number): Observable<{ success: boolean; inventory: InventoryEntry[] }> {
    return this.http.delete<any>(`${API_BASE}/api/character/${characterId}/inventory/${itemId}`);
  }

  // ── Shop ───────────────────────────────────────────────────────────────────
  getShop(shopId: number): Observable<{ shop: any; items: any[] }> {
    return this.http.get<any>(`${API_BASE}/api/shop/${shopId}`);
  }

  shopTransaction(body: {
    sessionId: string;
    characterId: string;
    shopId: number;
    action: 'buy' | 'sell';
    itemId: number;
    quantity: number;
  }): Observable<{ success: boolean; updatedGold: number }> {
    return this.http.post<any>(`${API_BASE}/api/shop/transaction`, body);
  }
}
