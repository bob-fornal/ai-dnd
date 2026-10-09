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

@Component({
  selector: 'app-character-creation',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatCardModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatStepperModule, MatProgressSpinnerModule,
    MatChipsModule, MatTooltipModule,
  ],
  templateUrl: './character-creation.component.html',
  styleUrl: './character-creation.component.css',
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

    this.api.createCharacter({
      name: this.name().trim(),
      race: this.race() as Race,
      class: this.characterClass() as CharacterClass,
      abilityRollMethod: this.rollMethod(),
    }).subscribe({
      next: (res) => {
        this.charSvc.setCharacter(res.character);

        // Save campaign slot
        const slotId = crypto.randomUUID();
        this.auth.addCampaign({
          slotId,
          characterName: res.character.name,
          characterClass: res.character.class,
          characterRace: res.character.race,
          level: 1,
          sessionId: res.sessionId,
          characterId: res.characterId,
          lastPlayed: new Date().toISOString(),
          location: 'Millhaven — The Rusty Flagon Inn',
        });

        this.router.navigate(['/game', res.sessionId], {
          state: { startNarrative: res.startNarrative, backstory: res.backstory },
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error ?? 'Failed to create character. Is the Worker running?');
      },
    });
  }
}
