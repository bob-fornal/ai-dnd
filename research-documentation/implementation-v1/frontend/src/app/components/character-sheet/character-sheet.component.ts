import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { CharacterStateService } from '../../services/character-state.service';
import { ABILITY_LABELS } from '../../models/game.models';
import type { AbilityKey } from '../../models/game.models';

@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatTooltipModule, MatIconModule],
  templateUrl: './character-sheet.component.html',
  styleUrl: './character-sheet.component.css',
})
export class CharacterSheetComponent {
  svc = inject(CharacterStateService);

  abilityKeys: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  abilityLabels = ABILITY_LABELS;
}
