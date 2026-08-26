import {
  Component, inject, signal, OnInit, AfterViewChecked,
  ViewChild, ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GameApiService } from '../../services/game-api.service';
import { CharacterStateService } from '../../services/character-state.service';
import { AuthService } from '../../services/auth.service';
import { CharacterSheetComponent } from '../character-sheet/character-sheet.component';
import type { LogEntry, CombatState, AbilityKey } from '../../models/game.models';

interface DisplayEntry {
  type: 'dm' | 'player' | 'system' | 'combat';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-game-console',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule,
    MatIconModule, MatProgressSpinnerModule, MatChipsModule,
    MatDialogModule, MatTooltipModule,
    CharacterSheetComponent,
  ],
  template: `
    <div class="game-layout" [class.in-combat-border]="charSvc.inCombat()">

      <!-- ── Left Sidebar: Character Sheet ────────────────────────────────── -->
      <aside class="sidebar left-sidebar">
        <app-character-sheet />

        <!-- Level Up Panel -->
        @if (charSvc.canLevelUp()) {
          <div class="levelup-panel">
            <p class="lu-title title-font gold">Choose Ability to Improve (+2)</p>
            <div class="ability-grid">
              @for (key of abilityKeys; track key) {
                <button mat-stroked-button (click)="levelUp(key)" [disabled]="luLoading()">
                  {{ key.toUpperCase() }}
                </button>
              }
            </div>
          </div>
        }
      </aside>

      <!-- ── Main Console ─────────────────────────────────────────────────── -->
      <main class="console-area">

        <!-- Combat Header -->
        @if (charSvc.inCombat() && charSvc.combatState(); as cs) {
          <div class="combat-header">
            <span class="combat-label">⚔ COMBAT — Round {{ cs.round }}</span>
            <div class="monster-info">
              <span>{{ cs.monster.name }}</span>
              <div class="enemy-hp-bar">
                <div class="enemy-hp-fill"
                     [style.width.%]="enemyHpPercent(cs)"></div>
              </div>
              <span class="text-muted">{{ cs.monster.hp }}/{{ cs.monster.max_hp }} HP</span>
            </div>
          </div>
        }

        <!-- Narrative Output -->
        <div class="narrative-scroll" #narrativeScroll>
          @for (entry of entries(); track $index) {
            <div class="narrative-block"
                 [class.player-action]="entry.type === 'player'"
                 [class.system-msg]="entry.type === 'system'"
                 [class.combat-msg]="entry.type === 'combat'">
              {{ entry.content }}
            </div>
          }
          @if (loading()) {
            <div class="thinking-indicator">
              <mat-spinner diameter="20" />
              <span class="text-muted narrative-font">The Dungeon Master deliberates…</span>
            </div>
          }
        </div>

        <!-- Quick Action Chips -->
        @if (!loading() && suggestedActions().length > 0 && !charSvc.inCombat()) {
          <div class="suggested-actions">
            @for (action of suggestedActions(); track action) {
              <button class="action-chip" mat-stroked-button (click)="sendQuickAction(action)">
                {{ action }}
              </button>
            }
          </div>
        }

        <!-- Combat Action Buttons -->
        @if (charSvc.inCombat()) {
          <div class="combat-actions">
            <button mat-raised-button color="warn"   (click)="combatAction('attack')"   [disabled]="loading()">
              ⚔ Attack
            </button>
            <button mat-stroked-button               (click)="combatAction('dodge')"    [disabled]="loading()">
              🛡 Dodge
            </button>
            <button mat-stroked-button color="accent" (click)="combatAction('use_item')" [disabled]="loading()">
              🧪 Use Item
            </button>
            <button mat-stroked-button               (click)="combatAction('flee')"     [disabled]="loading()">
              💨 Flee
            </button>
          </div>
        }

        <!-- Input Bar -->
        @if (!charSvc.inCombat()) {
          <div class="input-row">
            <mat-form-field appearance="outline" class="input-field">
              <input matInput
                     [(ngModel)]="playerInput"
                     placeholder="What do you do?"
                     (keyup.enter)="sendAction()"
                     [disabled]="loading()"
                     maxlength="500" />
            </mat-form-field>
            <button mat-raised-button color="primary"
                    (click)="sendAction()"
                    [disabled]="loading() || !playerInput.trim()">
              Send
            </button>
          </div>
        }

      </main>

      <!-- ── Right Sidebar: Adventure Log ────────────────────────────────── -->
      <aside class="sidebar right-sidebar">
        <h4 class="title-font sidebar-title gold">Adventure Log</h4>
        <div class="log-scroll">
          @for (entry of logEntries(); track entry.id) {
            <div class="log-entry" [class]="entry.actor">
              <span class="log-actor">{{ entry.actor === 'dm' ? '🗺 DM' : entry.actor === 'player' ? '⚔ You' : '⚙' }}</span>
              <p class="log-text">{{ entry.content }}</p>
            </div>
          }
          @if (logEntries().length === 0) {
            <p class="text-muted" style="font-size:.8rem;padding:.5rem">Your adventure log is empty.</p>
          }
        </div>
        <button mat-button class="log-more-btn" (click)="loadMoreLog()"
                [disabled]="logLoading() || logExhausted()">
          {{ logExhausted() ? 'Beginning of log' : 'Load more' }}
        </button>
      </aside>

    </div>
  `,
  styles: [`
    .game-layout {
      display: grid;
      grid-template-columns: 220px 1fr 240px;
      height: 100vh;
      overflow: hidden;
      background: var(--bg-deep);
      transition: box-shadow .3s;
    }

    @media (max-width: 900px) {
      .game-layout { grid-template-columns: 1fr; grid-template-rows: auto 1fr auto; }
      .left-sidebar, .right-sidebar { max-height: 200px; overflow-y: auto; }
    }

    /* ── Sidebars ─────────────────────────────────────────── */
    .sidebar {
      border-right: 1px solid var(--border);
      background: var(--bg-surface);
      overflow-y: auto;
      padding: .5rem;
    }

    .right-sidebar {
      border-right: none;
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
    }

    .sidebar-title { font-size: .85rem; margin: .25rem 0 .75rem; padding-bottom: .5rem; border-bottom: 1px solid var(--border); }

    /* ── Level Up ─────────────────────────────────────────── */
    .levelup-panel {
      margin-top: .75rem;
      border: 1px solid var(--gold);
      border-radius: 6px;
      padding: .75rem;
    }

    .lu-title { font-size: .78rem; margin: 0 0 .5rem; }

    .ability-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: .3rem; }
    .ability-grid button { min-width: 0; font-size: .75rem; padding: 0 .25rem; }

    /* ── Console Area ─────────────────────────────────────── */
    .console-area {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .combat-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: .5rem 1rem;
      background: rgba(198,40,40,.12);
      border-bottom: 1px solid var(--red);
      flex-shrink: 0;
    }

    .combat-label {
      font-family: var(--title-font);
      font-size: .85rem;
      color: var(--red-light);
      white-space: nowrap;
    }

    .monster-info {
      display: flex;
      align-items: center;
      gap: .5rem;
      flex: 1;
      font-size: .85rem;
    }

    .enemy-hp-bar {
      flex: 1;
      height: 6px;
      background: var(--border);
      border-radius: 3px;
      overflow: hidden;
    }

    .enemy-hp-fill {
      height: 100%;
      background: var(--red-light);
      border-radius: 3px;
      transition: width .4s;
    }

    .narrative-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }

    .thinking-indicator {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .5rem 0;
      span { font-size: .9rem; }
    }

    .suggested-actions {
      display: flex;
      flex-wrap: wrap;
      gap: .4rem;
      padding: .5rem 1rem;
      border-top: 1px solid var(--border);
      flex-shrink: 0;
    }

    .combat-actions {
      display: flex;
      gap: .5rem;
      padding: .75rem 1rem;
      border-top: 1px solid var(--red);
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .input-row {
      display: flex;
      gap: .5rem;
      padding: .5rem 1rem;
      border-top: 1px solid var(--border);
      align-items: center;
      flex-shrink: 0;
    }

    .input-field { flex: 1; }
    .input-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }

    /* ── Log ──────────────────────────────────────────────── */
    .log-scroll {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: .4rem;
    }

    .log-entry {
      padding: .4rem .5rem;
      border-radius: 4px;
      border-left: 2px solid var(--border);
      font-size: .78rem;

      &.dm     { border-left-color: var(--gold); }
      &.player { border-left-color: var(--purple-light); }
      &.system { border-left-color: var(--text-muted); }

      .log-actor { font-size: .68rem; color: var(--text-muted); display: block; margin-bottom: .15rem; }
      .log-text  { margin: 0; color: var(--text); line-height: 1.4; }
    }

    .log-more-btn { font-size: .75rem; width: 100%; margin-top: .5rem; }
  `],
})
export class GameConsoleComponent implements OnInit, AfterViewChecked {
  @ViewChild('narrativeScroll') narrativeScroll!: ElementRef<HTMLDivElement>;

  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private api     = inject(GameApiService);
  readonly charSvc = inject(CharacterStateService);
  private auth    = inject(AuthService);

  sessionId   = '';
  characterId = '';
  playerInput = '';

  entries         = signal<DisplayEntry[]>([]);
  suggestedActions = signal<string[]>([]);
  loading         = signal(false);
  logEntries      = signal<LogEntry[]>([]);
  logLoading      = signal(false);
  logPage         = 0;
  logExhausted    = signal(false);
  luLoading       = signal(false);

  abilityKeys: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

  private shouldScroll = false;

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
    if (!this.sessionId) { this.router.navigate(['/login']); return; }

    // Check if we came from character creation (has state)
    const nav = history.state as { startNarrative?: string; backstory?: string };
    if (nav?.startNarrative) {
      this.pushEntry('dm', nav.startNarrative);
      this.suggestedActions.set(['Look around', 'Talk to the innkeeper', 'Order a drink', 'Ask about quests']);
    }

    // Load session + character
    this.api.getSession(this.sessionId).subscribe({
      next: (res) => {
        this.characterId = res.character.id;
        this.charSvc.setCharacter(res.character);

        // If no start narrative was passed, show location context
        if (!nav?.startNarrative) {
          const loc = res.session?.location ?? 'the world';
          this.pushEntry('system', `📍 You are in ${loc}. Your adventure resumes.`);
        }

        // Load log
        this.loadLog();
      },
      error: () => {
        this.pushEntry('system', '⚠ Could not load session. Is the Worker running?');
      },
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollBottom();
      this.shouldScroll = false;
    }
  }

  sendAction(): void {
    const action = this.playerInput.trim();
    if (!action || this.loading()) return;
    this.playerInput = '';
    this.pushEntry('player', action);
    this.loading.set(true);
    this.suggestedActions.set([]);

    this.api.sendAction(this.sessionId, this.characterId, action).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.pushEntry('dm', res.narrative);
        this.suggestedActions.set(res.suggestedActions);
        this.charSvc.setCharacter(res.updatedCharacter);
        this.charSvc.setCombatState(res.combatState, res.inCombat);
        this.charSvc.setCanLevelUp(res.canLevelUp);
        this.updateCampaignSlot(res.updatedCharacter.level);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.error ?? 'The Dungeon Master falls silent… (API error)';
        this.pushEntry('system', `⚠ ${msg}`);
      },
    });
  }

  sendQuickAction(action: string): void {
    this.playerInput = action;
    this.sendAction();
  }

  combatAction(action: 'attack' | 'dodge' | 'flee' | 'use_item'): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.pushEntry('player', `[${action.replace('_', ' ')}]`);

    this.api.resolveCombat(this.sessionId, this.characterId, action).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.pushEntry('combat', res.narrative);
        this.charSvc.setCharacter(res.updatedCharacter);
        this.charSvc.setCombatState(res.combatState, res.inCombat);
        this.charSvc.setCanLevelUp(res.canLevelUp);

        if (res.combatEnded) {
          if (res.victory) {
            const lootMsg = res.loot.length > 0
              ? `You find: ${res.loot.map(l => l.name).join(', ')}.`
              : '';
            this.pushEntry('system', `✅ Victory! +${res.xpGained} XP. ${lootMsg}`);
            this.suggestedActions.set(['Search the area', 'Rest a moment', 'Press on', 'Count the loot']);
          } else if (res.playerDied) {
            this.pushEntry('system', '💀 You have fallen. Your legend ends here… for now.');
          } else {
            this.pushEntry('system', '💨 You escaped. The battle is behind you — for now.');
            this.suggestedActions.set(['Catch your breath', 'Find shelter', 'Tend your wounds']);
          }
        }

        if (res.canLevelUp) {
          this.pushEntry('system', '⬆ You have enough XP to level up! Choose an ability to improve.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.pushEntry('system', `⚠ ${err?.error?.error ?? 'Combat error'}`);
      },
    });
  }

  levelUp(ability: AbilityKey): void {
    if (this.luLoading()) return;
    this.luLoading.set(true);

    this.api.levelUp(this.sessionId, this.characterId, ability).subscribe({
      next: (res) => {
        this.luLoading.set(false);
        this.charSvc.setCharacter(res.updatedCharacter);
        this.charSvc.setCanLevelUp(false);
        this.pushEntry('system', `⬆ Level ${res.newLevel}! ${res.narrative}`);
        this.updateCampaignSlot(res.newLevel);
      },
      error: () => { this.luLoading.set(false); },
    });
  }

  loadMoreLog(): void {
    if (this.logLoading() || this.logExhausted()) return;
    this.logLoading.set(true);
    this.logPage++;
    this.api.getLog(this.sessionId, this.logPage, 20).subscribe({
      next: (res) => {
        this.logLoading.set(false);
        this.logEntries.update(prev => [...res.entries, ...prev]);
        if (this.logPage * 20 >= res.total) this.logExhausted.set(true);
      },
      error: () => { this.logLoading.set(false); },
    });
  }

  enemyHpPercent(cs: CombatState): number {
    return Math.round((cs.monster.hp / cs.monster.max_hp) * 100);
  }

  // ── Private ────────────────────────────────────────────────────────────────
  private pushEntry(type: DisplayEntry['type'], content: string): void {
    this.entries.update(prev => [...prev, { type, content, timestamp: new Date() }]);
    this.shouldScroll = true;
  }

  private scrollBottom(): void {
    const el = this.narrativeScroll?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  private loadLog(): void {
    this.api.getLog(this.sessionId, 0, 20).subscribe({
      next: (res) => {
        this.logEntries.set(res.entries);
        if (res.entries.length >= res.total) this.logExhausted.set(true);
      },
    });
  }

  private updateCampaignSlot(level: number): void {
    const profile = this.auth.profile();
    if (!profile) return;
    const slot = profile.campaigns.find(c => c.sessionId === this.sessionId);
    if (slot) {
      this.auth.updateCampaign(slot.slotId, { level, lastPlayed: new Date().toISOString() });
    }
  }
}
