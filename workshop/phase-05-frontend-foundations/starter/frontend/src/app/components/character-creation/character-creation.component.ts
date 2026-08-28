import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GameApiService } from '../../services/game-api.service';
import { AuthService } from '../../services/auth.service';
import { CharacterStateService } from '../../services/character-state.service';
import type { Race, CharacterClass } from '../../models/game.models';

interface RaceOption { value: Race; icon: string; bonus: string; }
interface ClassOption { value: CharacterClass; icon: string; desc: string; hitDie: string; }

// FOCUS FILE — the template/styles below are complete (multi-step
// mat-stepper form isn't this workshop's teaching focus). Your job is the
// class body: the ability-roll method selection is already wired via
// signals, but `createCharacter()` needs to call GameApiService, update
// CharacterStateService, save a campaign slot, and navigate on success.

@Component({
  selector: 'app-character-creation',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatCardModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatStepperModule, MatProgressSpinnerModule,
    MatChipsModule, MatTooltipModule,
  ],
  template: `
    <div class="creation-bg">
      <div class="creation-container">

        <h1 class="title-font page-title gold">Forge Your Legend</h1>

        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="60" />
            <p class="narrative-font">The Dungeon Master prepares your world…</p>
          </div>
        } @else {

          <mat-stepper linear #stepper class="dnd-stepper">

            <!-- Step 1: Name & Roll Method -->
            <mat-step label="Identity" [completed]="!!name()">
              <div class="step-content">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Character Name</mat-label>
                  <input matInput [(ngModel)]="name" placeholder="e.g. Kaiden Ashblood…" maxlength="40" />
                </mat-form-field>

                <p class="section-label">Ability Score Method</p>
                <div class="method-grid">
                  <div class="method-card" [class.selected]="rollMethod() === 'standard'"
                       (click)="rollMethod.set('standard')">
                    <span class="method-icon">📋</span>
                    <strong>Standard Array</strong>
                    <small>15,14,13,12,10,8 — balanced and reliable</small>
                  </div>
                  <div class="method-card" [class.selected]="rollMethod() === 'roll'"
                       (click)="rollMethod.set('roll')">
                    <span class="method-icon">🎲</span>
                    <strong>Roll the Dice</strong>
                    <small>4d6 drop lowest — chaos and glory</small>
                  </div>
                </div>
              </div>
              <div class="step-actions">
                <button mat-raised-button color="primary" matStepperNext [disabled]="!name().trim()">
                  Next
                </button>
              </div>
            </mat-step>

            <!-- Step 2: Race -->
            <mat-step label="Race" [completed]="!!race()">
              <div class="step-content">
                <p class="section-label">Choose Your Race</p>
                <div class="option-grid">
                  @for (r of races; track r.value) {
                    <div class="option-card" [class.selected]="race() === r.value"
                         (click)="race.set(r.value)"
                         [matTooltip]="r.bonus">
                      <span class="opt-icon">{{ r.icon }}</span>
                      <strong>{{ r.value }}</strong>
                      <small class="text-muted">{{ r.bonus }}</small>
                    </div>
                  }
                </div>
              </div>
              <div class="step-actions">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-raised-button color="primary" matStepperNext [disabled]="!race()">
                  Next
                </button>
              </div>
            </mat-step>

            <!-- Step 3: Class -->
            <mat-step label="Class" [completed]="!!characterClass()">
              <div class="step-content">
                <p class="section-label">Choose Your Class</p>
                <div class="option-grid">
                  @for (cls of classes; track cls.value) {
                    <div class="option-card" [class.selected]="characterClass() === cls.value"
                         (click)="characterClass.set(cls.value)">
                      <span class="opt-icon">{{ cls.icon }}</span>
                      <strong>{{ cls.value }}</strong>
                      <small class="text-muted">{{ cls.desc }}</small>
                      <span class="hit-die gold">HD: {{ cls.hitDie }}</span>
                    </div>
                  }
                </div>
              </div>
              <div class="step-actions">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-raised-button color="primary" matStepperNext [disabled]="!characterClass()">
                  Next
                </button>
              </div>
            </mat-step>

            <!-- Step 4: Review & Create -->
            <mat-step label="Begin">
              <div class="step-content review-step">
                <div class="review-card">
                  <div class="review-row"><span class="review-label">Name</span><strong>{{ name() }}</strong></div>
                  <div class="review-row"><span class="review-label">Race</span><strong>{{ race() }}</strong></div>
                  <div class="review-row"><span class="review-label">Class</span><strong>{{ characterClass() }}</strong></div>
                  <div class="review-row"><span class="review-label">Ability Scores</span>
                    <strong>{{ rollMethod() === 'roll' ? '🎲 Rolled (surprise!)' : '📋 Standard Array' }}</strong>
                  </div>
                </div>

                @if (error()) {
                  <p class="error-text">{{ error() }}</p>
                }

                <p class="narrative-font creation-flavor">
                  "The gods watch from their distant thrones. Another soul steps forward, daring to carve their name
                  into the living history of Aethermoor. The world will not be gentle — but it will be <em>unforgettable.</em>"
                </p>
              </div>
              <div class="step-actions">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-raised-button color="accent" class="create-btn"
                        (click)="createCharacter()"
                        [disabled]="!canCreate()">
                  ⚔ Enter the World
                </button>
              </div>
            </mat-step>

          </mat-stepper>
        }

      </div>
    </div>
  `,
  styles: [`
    .creation-bg {
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      background: radial-gradient(ellipse at 50% 0%, rgba(123,31,162,.2) 0%, var(--bg-deep) 70%);
      padding: 2rem 1rem;
      overflow-y: auto;
    }

    .creation-container {
      width: 100%;
      max-width: 720px;
    }

    .page-title {
      font-size: 2.2rem;
      text-align: center;
      margin: 0 0 2rem;
      text-shadow: 0 0 30px rgba(212,160,23,.3);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      padding: 4rem 0;
      p { color: var(--text-muted); font-size: 1.1rem; }
    }

    .dnd-stepper ::ng-deep .mat-step-header .mat-step-icon { background: var(--purple); }

    .step-content { padding: 1.5rem 0; }
    .full-width { width: 100%; }

    .section-label {
      color: var(--gold);
      font-family: var(--title-font);
      font-size: .85rem;
      letter-spacing: .08em;
      text-transform: uppercase;
      margin: 0 0 .75rem;
    }

    .method-grid, .option-grid {
      display: grid;
      gap: .75rem;
    }

    .method-grid { grid-template-columns: 1fr 1fr; }
    .option-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }

    .method-card, .option-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: .35rem;
      padding: 1rem;
      border: 2px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      text-align: center;
      transition: border-color .2s, background .2s;

      &:hover { border-color: var(--purple-light); }
      &.selected {
        border-color: var(--gold);
        background: rgba(212,160,23,.08);
      }

      .opt-icon, .method-icon { font-size: 1.8rem; }
      strong { font-size: .95rem; color: var(--text); }
      small { font-size: .78rem; color: var(--text-muted); line-height: 1.4; }
      .hit-die { font-size: .78rem; font-family: var(--title-font); margin-top: .25rem; }
    }

    .review-step { display: flex; flex-direction: column; gap: 1rem; }

    .review-card {
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    .review-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: .75rem 1rem;
      border-bottom: 1px solid var(--border);

      &:last-child { border-bottom: none; }

      .review-label { color: var(--text-muted); font-size: .9rem; }
      strong { color: var(--text); }
    }

    .creation-flavor {
      color: var(--text-muted);
      font-size: 1rem;
      border-left: 3px solid var(--gold);
      padding-left: 1rem;
      margin: 0;
    }

    .step-actions {
      display: flex;
      gap: .75rem;
      padding-top: .5rem;
    }

    .create-btn { height: 48px; font-size: 1rem; padding: 0 2rem; }
    .error-text { color: var(--red-light); font-size: .85rem; }
  `],
})
export class CharacterCreationComponent {
  private api     = inject(GameApiService);
  private auth    = inject(AuthService);
  private charSvc = inject(CharacterStateService);
  private router  = inject(Router);

  name             = signal('');
  race             = signal<Race | ''>('');
  characterClass   = signal<CharacterClass | ''>('');
  rollMethod       = signal<'roll' | 'standard'>('standard');
  loading          = signal(false);
  error            = signal('');

  canCreate = () => !!this.name().trim() && !!this.race() && !!this.characterClass();

  races: RaceOption[] = [
    { value: 'Human',    icon: '🧑', bonus: '+1 all abilities' },
    { value: 'Elf',      icon: '🧝', bonus: '+2 DEX, +1 INT' },
    { value: 'Dwarf',    icon: '⛏️',  bonus: '+2 CON, +1 STR' },
    { value: 'Halfling', icon: '🌱', bonus: '+2 DEX, +1 CHA' },
    { value: 'Orc',      icon: '💀', bonus: '+2 STR, +1 CON' },
    { value: 'Tiefling', icon: '👹', bonus: '+2 CHA, +1 INT' },
  ];

  classes: ClassOption[] = [
    { value: 'Fighter', icon: '⚔️',  desc: 'Master of martial combat', hitDie: 'd10' },
    { value: 'Wizard',  icon: '🔮', desc: 'Wielder of arcane power',   hitDie: 'd6'  },
    { value: 'Rogue',   icon: '🗡️',  desc: 'Shadow and deception',     hitDie: 'd8'  },
    { value: 'Cleric',  icon: '✝️',  desc: 'Divine warrior-priest',    hitDie: 'd8'  },
    { value: 'Ranger',  icon: '🏹', desc: 'Hunter of the wilds',      hitDie: 'd10' },
    { value: 'Bard',    icon: '🎸', desc: 'Lore and blade combined',  hitDie: 'd8'  },
  ];

  createCharacter(): void {
    if (!this.canCreate()) return;
    this.loading.set(true);
    this.error.set('');

    // TODO: call this.api.createCharacter({ name, race, class, abilityRollMethod })
    //   .subscribe({
    //     next: (res) => {
    //       - this.charSvc.setCharacter(res.character)
    //       - build a CampaignSlot (crypto.randomUUID() for slotId) and save
    //         it via this.auth.addCampaign(...)
    //       - this.router.navigate(['/game', res.sessionId], { state: {
    //           startNarrative: res.startNarrative, backstory: res.backstory } })
    //     },
    //     error: (err) => {
    //       - this.loading.set(false)
    //       - this.error.set(err?.error?.error ?? 'Failed to create character. Is the Worker running?')
    //     },
    //   });
  }
}
