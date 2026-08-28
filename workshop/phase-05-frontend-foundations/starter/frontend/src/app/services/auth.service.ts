import { Injectable, signal } from '@angular/core';
import type { UserProfile, CampaignSlot } from '../models/game.models';

const STORAGE_KEY = 'ai_dnd_user';

// FOCUS FILE — per PRD.md NF-08, there is no real backend account system in
// this MVP: "logging in" just means storing a UserProfile (username +
// campaign slots) in localStorage under a per-username key. Every method
// signature below is final — fill in the localStorage get/set/clear logic.

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _profile = signal<UserProfile | null>(null); // TODO: initialize from loadProfile()

  readonly profile = this._profile.asReadonly();

  isLoggedIn(): boolean {
    // TODO: true once a profile has been loaded/created
    return false;
  }

  login(username: string): void {
    // TODO: trim the username, look for an existing profile via
    // loadProfileByName(); if found, set it. Otherwise build a fresh
    // UserProfile ({ username, campaigns: [] }), set it, and persist it.
  }

  logout(): void {
    // TODO: clear the profile signal and remove STORAGE_KEY from localStorage
  }

  addCampaign(slot: CampaignSlot): void {
    // TODO: push slot onto the current profile's campaigns array, update the
    // signal (new object reference!) and persist
  }

  updateCampaign(slotId: string, changes: Partial<CampaignSlot>): void {
    // TODO: find the campaign by slotId, merge in `changes`, update the
    // signal and persist
  }

  removeCampaign(slotId: string): void {
    // TODO: filter the campaign out by slotId, update the signal and persist
  }

  // ── Private ────────────────────────────────────────────────────────────────
  private loadProfile(): UserProfile | null {
    // TODO: read STORAGE_KEY from localStorage and JSON.parse it (guard with try/catch)
    return null;
  }

  private loadProfileByName(username: string): UserProfile | null {
    // TODO: read `ai_dnd_user_${username.toLowerCase()}` from localStorage
    // and JSON.parse it (guard with try/catch)
    return null;
  }

  private persist(profile: UserProfile): void {
    // TODO: JSON.stringify `profile` into both the per-username key and
    // STORAGE_KEY (guard with try/catch — localStorage can be unavailable)
  }
}
