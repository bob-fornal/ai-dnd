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
  templateUrl: './game-console.component.html',
  styleUrl: './game-console.component.css',
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

        // Load inventory into state service
        this.api.getInventory(res.character.id).subscribe({
          next: (inv) => this.charSvc.setInventory(inv.inventory),
        });

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

  openInventory(): void {
    const dialogData: InventoryDialogData = {
      characterId: this.characterId,
      sessionId: this.sessionId,
    };
    const ref = this.dialog.open(InventoryComponent, {
      data: dialogData,
      panelClass: 'inv-dialog-panel',
      maxHeight: '90vh',
    });
    ref.afterClosed().subscribe(() => {
      // Refresh inventory signal from service (component already updated it)
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
