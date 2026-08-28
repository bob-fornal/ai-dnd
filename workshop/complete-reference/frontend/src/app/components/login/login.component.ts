import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import type { CampaignSlot } from '../../models/game.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule,
    MatCardModule, MatDividerModule, MatIconModule,
  ],
  template: `
    <div class="login-bg">
      <div class="login-container">

        <div class="title-block">
          <h1 class="title-font">⚔ AI Dungeon</h1>
          <p class="subtitle text-muted">A dark fantasy adventure powered by Cloudflare Worker AI</p>
        </div>

        @if (!profile()) {
          <!-- Username entry -->
          <mat-card class="login-card">
            <mat-card-header>
              <mat-card-title class="title-font">Enter the World</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Your Name, Adventurer</mat-label>
                <input matInput [(ngModel)]="username" (keyup.enter)="login()"
                       placeholder="e.g. Aldric, Shadowmere…" maxlength="30" />
              </mat-form-field>
              @if (error()) {
                <p class="error-text">{{ error() }}</p>
              }
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" class="full-width cta-btn"
                      (click)="login()">
                Begin Your Legend
              </button>
            </mat-card-actions>
          </mat-card>
        } @else {
          <!-- Campaign slots -->
          <mat-card class="login-card">
            <mat-card-header>
              <mat-card-title class="title-font">
                Welcome back, {{ profile()!.username }}
              </mat-card-title>
              <mat-card-subtitle>Choose a campaign or start anew</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (profile()!.campaigns.length > 0) {
                <div class="campaign-list">
                  @for (slot of profile()!.campaigns; track slot.slotId) {
                    <div class="campaign-slot" (click)="resumeCampaign(slot)">
                      <div class="slot-info">
                        <span class="slot-name title-font">{{ slot.characterName }}</span>
                        <span class="slot-details text-muted">
                          Level {{ slot.level }} {{ slot.characterRace }} {{ slot.characterClass }}
                        </span>
                        <span class="slot-location text-muted">📍 {{ slot.location }}</span>
                      </div>
                      <div class="slot-actions">
                        <button mat-icon-button color="warn"
                                (click)="deleteCampaign($event, slot.slotId)">
                          <mat-icon>delete_forever</mat-icon>
                        </button>
                      </div>
                    </div>
                  }
                </div>
                <mat-divider />
              }
            </mat-card-content>
            <mat-card-actions class="card-actions">
              <button mat-raised-button color="primary" (click)="newCampaign()">
                + New Campaign
              </button>
              <button mat-button (click)="switchUser()">
                Switch Adventurer
              </button>
            </mat-card-actions>
          </mat-card>
        }

      </div>
    </div>
  `,
  styles: [`
    .login-bg {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(ellipse at 50% 0%, rgba(123,31,162,.25) 0%, var(--bg-deep) 70%);
      padding: 2rem;
    }

    .login-container {
      width: 100%;
      max-width: 480px;
    }

    .title-block {
      text-align: center;
      margin-bottom: 2rem;
      h1 {
        font-size: 2.8rem;
        font-weight: 700;
        color: var(--gold);
        text-shadow: 0 0 40px rgba(212,160,23,.4);
        margin: 0 0 .5rem;
      }
    }

    .subtitle { font-size: .95rem; margin: 0; }

    .login-card {
      border: 1px solid var(--border) !important;
      background: var(--bg-card) !important;
    }

    .full-width { width: 100%; }

    .cta-btn {
      width: 100%;
      height: 48px;
      font-size: 1rem;
    }

    .error-text { color: var(--red-light); font-size: .85rem; }

    .campaign-list {
      display: flex;
      flex-direction: column;
      gap: .5rem;
      margin: .5rem 0 1rem;
    }

    .campaign-slot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: .75rem 1rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      cursor: pointer;
      transition: border-color .2s, background .2s;

      &:hover {
        border-color: var(--gold);
        background: rgba(212,160,23,.05);
      }

      .slot-info {
        display: flex;
        flex-direction: column;
        gap: .15rem;
      }

      .slot-name {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text);
      }

      .slot-details, .slot-location {
        font-size: .8rem;
      }
    }

    .card-actions {
      display: flex;
      gap: .5rem;
      padding: 0 1rem 1rem;
    }
  `],
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  username = '';
  error    = signal('');
  profile  = this.auth.profile;

  login(): void {
    if (!this.username.trim()) {
      this.error.set('Please enter a name to continue.');
      return;
    }
    this.error.set('');
    this.auth.login(this.username);
    const campaigns = this.auth.profile()?.campaigns ?? [];
    if (campaigns.length === 0) {
      this.router.navigate(['/characters']);
    }
    // else stay on login to show campaign slots
  }

  newCampaign(): void {
    this.router.navigate(['/characters']);
  }

  resumeCampaign(slot: CampaignSlot): void {
    this.router.navigate(['/game', slot.sessionId]);
  }

  deleteCampaign(event: Event, slotId: string): void {
    event.stopPropagation();
    this.auth.removeCampaign(slotId);
  }

  switchUser(): void {
    this.auth.logout();
    this.username = '';
  }
}
