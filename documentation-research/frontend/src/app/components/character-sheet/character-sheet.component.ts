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
  template: `
    @if (svc.character(); as c) {
      <div class="sheet">
        <!-- Name & Class -->
        <div class="char-header">
          <h3 class="title-font char-name">{{ c.name }}</h3>
          <span class="char-subtitle text-muted">
            Level {{ c.level }} {{ c.race }} {{ c.class }}
          </span>
        </div>

        <!-- HP Bar -->
        <div class="stat-row">
          <span class="stat-label">HP</span>
          <div class="hp-bar" style="flex:1">
            <div class="hp-fill"
                 [class.healthy]="svc.hpPercent() > 60"
                 [class.hurt]="svc.hpPercent() <= 60 && svc.hpPercent() > 25"
                 [class.critical]="svc.hpPercent() <= 25"
                 [style.width.%]="svc.hpPercent()"></div>
          </div>
          <span class="hp-text">{{ c.hp }}/{{ c.max_hp }}</span>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats">
          <div class="qstat">
            <span class="qstat-val gold">{{ c.ac }}</span>
            <span class="qstat-lbl">AC</span>
          </div>
          <div class="qstat">
            <span class="qstat-val">{{ c.xp }}</span>
            <span class="qstat-lbl">XP</span>
          </div>
          <div class="qstat">
            <span class="qstat-val gold">{{ c.gold }}g</span>
            <span class="qstat-lbl">Gold</span>
          </div>
        </div>

        <!-- XP Bar -->
        <div class="xp-row">
          <div class="xp-track">
            <div class="xp-fill" [style.width.%]="svc.xpPercent()"></div>
          </div>
          @if (c.level < 10) {
            <span class="xp-label text-muted">{{ svc.xpToNext() }} XP to Level {{ c.level + 1 }}</span>
          } @else {
            <span class="xp-label gold">⭐ Max Level</span>
          }
        </div>

        <!-- Ability Scores -->
        <div class="abilities">
          @for (key of abilityKeys; track key) {
            <div class="ability-cell" [matTooltip]="abilityLabels[key]">
              <span class="ability-key">{{ key.toUpperCase() }}</span>
              <span class="ability-score">{{ c[key] }}</span>
              <span class="ability-mod text-muted">
                {{ (svc.modifiers()?.[key] ?? 0) >= 0 ? '+' : '' }}{{ svc.modifiers()?.[key] ?? 0 }}
              </span>
            </div>
          }
        </div>

        <!-- Level Up Banner -->
        @if (svc.canLevelUp()) {
          <div class="levelup-banner gold">
            ⬆ Level Up Available!
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .sheet {
      padding: .75rem;
      display: flex;
      flex-direction: column;
      gap: .75rem;
    }

    .char-header {
      display: flex;
      flex-direction: column;
      gap: .2rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: .75rem;
    }

    .char-name {
      font-size: 1.1rem;
      color: var(--gold);
      margin: 0;
    }

    .char-subtitle { font-size: .78rem; }

    .stat-row {
      display: flex;
      align-items: center;
      gap: .5rem;
    }

    .stat-label {
      font-size: .72rem;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: var(--text-muted);
      width: 22px;
    }

    .hp-text { font-size: .8rem; min-width: 50px; text-align: right; }

    .quick-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: .5rem;
    }

    .qstat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: .5rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      gap: .15rem;
    }

    .qstat-val { font-size: 1rem; font-weight: 700; font-family: var(--title-font); }
    .qstat-lbl { font-size: .65rem; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); }

    .xp-row { display: flex; flex-direction: column; gap: .3rem; }

    .xp-track {
      height: 4px;
      background: var(--border);
      border-radius: 2px;
      overflow: hidden;
    }

    .xp-fill {
      height: 100%;
      background: var(--purple-light);
      border-radius: 2px;
      transition: width .4s ease;
    }

    .xp-label { font-size: .72rem; }

    .abilities {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: .4rem;
    }

    .ability-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: .4rem .25rem;
      border: 1px solid var(--border);
      border-radius: 4px;
      gap: .1rem;
      cursor: default;
    }

    .ability-key {
      font-size: .6rem;
      letter-spacing: .08em;
      color: var(--text-muted);
    }

    .ability-score {
      font-size: 1rem;
      font-weight: 700;
      font-family: var(--title-font);
    }

    .ability-mod { font-size: .7rem; }

    .levelup-banner {
      text-align: center;
      padding: .5rem;
      border: 1px solid var(--gold);
      border-radius: 4px;
      font-family: var(--title-font);
      font-size: .85rem;
      font-weight: 600;
      background: rgba(212,160,23,.1);
      animation: glow-gold 1.5s ease-in-out infinite alternate;
    }

    @keyframes glow-gold {
      from { box-shadow: 0 0 4px rgba(212,160,23,.3); }
      to   { box-shadow: 0 0 12px rgba(212,160,23,.6); }
    }
  `],
})
export class CharacterSheetComponent {
  svc = inject(CharacterStateService);

  abilityKeys: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  abilityLabels = ABILITY_LABELS;
}
