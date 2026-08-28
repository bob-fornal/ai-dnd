import { Injectable, signal } from '@angular/core';
import type { UserProfile, CampaignSlot } from '../models/game.models';

const STORAGE_KEY = 'ai_dnd_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _profile = signal<UserProfile | null>(this.loadProfile());

  readonly profile = this._profile.asReadonly();

  isLoggedIn(): boolean {
    return this._profile() !== null;
  }

  login(username: string): void {
    if (!username.trim()) return;
    const existing = this.loadProfileByName(username.trim());
    if (existing) {
      this._profile.set(existing);
    } else {
      const fresh: UserProfile = {
        username: username.trim(),
        campaigns: [],
      };
      this._profile.set(fresh);
      this.persist(fresh);
    }
  }

  logout(): void {
    this._profile.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  addCampaign(slot: CampaignSlot): void {
    const p = this._profile();
    if (!p) return;
    p.campaigns.push(slot);
    this._profile.set({ ...p });
    this.persist(p);
  }

  updateCampaign(slotId: string, changes: Partial<CampaignSlot>): void {
    const p = this._profile();
    if (!p) return;
    const idx = p.campaigns.findIndex(c => c.slotId === slotId);
    if (idx === -1) return;
    p.campaigns[idx] = { ...p.campaigns[idx]!, ...changes };
    this._profile.set({ ...p });
    this.persist(p);
  }

  removeCampaign(slotId: string): void {
    const p = this._profile();
    if (!p) return;
    p.campaigns = p.campaigns.filter(c => c.slotId !== slotId);
    this._profile.set({ ...p });
    this.persist(p);
  }

  // ── Private ────────────────────────────────────────────────────────────────
  private loadProfile(): UserProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  }

  private loadProfileByName(username: string): UserProfile | null {
    try {
      const key = `ai_dnd_user_${username.toLowerCase()}`;
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  }

  private persist(profile: UserProfile): void {
    try {
      const key = `ai_dnd_user_${profile.username.toLowerCase()}`;
      localStorage.setItem(key, JSON.stringify(profile));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch { /* localStorage unavailable */ }
  }
}
