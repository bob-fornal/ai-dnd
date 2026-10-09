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
