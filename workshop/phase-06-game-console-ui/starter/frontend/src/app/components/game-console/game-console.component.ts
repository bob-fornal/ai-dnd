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
import { InventoryComponent, type InventoryDialogData } from '../inventory/inventory.component';
import type { LogEntry, CombatState, AbilityKey } from '../../models/game.models';

interface DisplayEntry {
  type: 'dm' | 'player' | 'system' | 'combat';
  content: string;
  timestamp: Date;
}

// FOCUS FILE — the template/styles below are complete (it's a lot of markup,
// and layout isn't this workshop's teaching focus). The signal fields that
// read from CharacterStateService (charSvc.inCombat(), charSvc.combatState(),
// charSvc.canLevelUp(), charSvc.inventory()) are already wired — that's the
// Phase 5 state service doing its job. Your work is the class body: sending
// player actions/combat moves to GameApiService and reacting to the result,
// loading the session + log on init, opening the inventory dialog, leveling
// up, and auto-scrolling the narrative on new entries.

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

        <!-- Inventory Button -->
        <div class="sidebar-actions">
          <button mat-stroked-button class="inv-btn" (click)="openInventory()">
            <mat-icon>inventory_2</mat-icon>
            Inventory
            @if (charSvc.inventory().length > 0) {
              <span class="inv-count">({{ charSvc.inventory().length }})</span>
            }
          </button>
        </div>

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

    /* ── Sidebar Actions ──────────────────────────────────── */
    .sidebar-actions {
      margin-top: .5rem;
      padding-top: .5rem;
      border-top: 1px solid var(--border);
    }

    .inv-btn {
      width: 100%;
      font-size: .78rem;
      display: flex;
      align-items: center;
      gap: .3rem;
      justify-content: flex-start;
    }

    .inv-count {
      margin-left: auto;
      color: var(--text-muted);
      font-size: .72rem;
    }

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
  private dialog  = inject(MatDialog);
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

    // TODO: check `history.state` for a `startNarrative`/`backstory` passed
    // from CharacterCreationComponent — if present, push it as a 'dm' entry
    // and seed `suggestedActions` with some starter options.

    // TODO: call this.api.getSession(this.sessionId) to fetch the character
    // and session context:
    //   - set this.characterId from the response
    //   - this.charSvc.setCharacter(res.character)
    //   - if there was no startNarrative, push a 'system' entry describing
    //     the current location
    //   - call this.api.getInventory(...) and this.charSvc.setInventory(...)
    //   - call this.loadLog()
    //   - on error, push a 'system' entry warning the Worker may be down
  }

  ngAfterViewChecked(): void {
    // TODO: if `this.shouldScroll` is true, call this.scrollBottom() and
    // reset the flag (keeps the narrative pinned to the latest entry).
  }

  sendAction(): void {
    // TODO: read + trim playerInput, bail if empty or already loading, clear
    // the input, push a 'player' entry, set loading, clear suggestedActions,
    // then call this.api.sendAction(sessionId, characterId, action) and on
    // success push the DM narrative, update suggestedActions/character
    // state/combat state/canLevelUp, and refresh the campaign slot.
  }

  sendQuickAction(action: string): void {
    // TODO: set playerInput to `action` and call this.sendAction()
  }

  combatAction(action: 'attack' | 'dodge' | 'flee' | 'use_item'): void {
    // TODO: push a 'player' entry describing the action, set loading, call
    // this.api.resolveCombat(...), then push a 'combat' narrative entry and
    // update character/combat state. Handle combatEnded (victory/defeat/flee)
    // and canLevelUp with extra 'system' entries.
  }

  levelUp(ability: AbilityKey): void {
    // TODO: guard against double-submits with luLoading, call
    // this.api.levelUp(sessionId, characterId, ability), then update the
    // character state, clear canLevelUp, push a 'system' entry with the
    // level-up narrative, and refresh the campaign slot.
  }

  loadMoreLog(): void {
    // TODO: guard against double-loads/exhaustion, increment logPage, call
    // this.api.getLog(sessionId, logPage, 20), and prepend the results to
    // logEntries. Mark logExhausted once every entry has been loaded.
  }

  enemyHpPercent(cs: CombatState): number {
    // TODO: return the enemy's hp / max_hp as a rounded percentage
    return 0;
  }

  // ── Private ────────────────────────────────────────────────────────────────
  private pushEntry(type: DisplayEntry['type'], content: string): void {
    // TODO: append { type, content, timestamp: new Date() } to `entries`
    // and set `this.shouldScroll = true`
  }

  private scrollBottom(): void {
    // TODO: set narrativeScroll's nativeElement.scrollTop to its scrollHeight
  }

  private loadLog(): void {
    // TODO: call this.api.getLog(sessionId, 0, 20), set logEntries, and mark
    // logExhausted if every entry was already returned
  }

  openInventory(): void {
    // TODO: build an InventoryDialogData ({ characterId, sessionId }) and
    // open InventoryComponent via this.dialog.open(...). The inventory
    // component (provided complete this phase) updates CharacterStateService
    // itself, so nothing else is required after it closes.
  }

  private updateCampaignSlot(level: number): void {
    // TODO: find the campaign slot matching this.sessionId on the logged-in
    // profile and call this.auth.updateCampaign(slotId, { level, lastPlayed })
  }
}
