import {
  Component, inject, signal, computed, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GameApiService } from '../../services/game-api.service';
import { CharacterStateService } from '../../services/character-state.service';
import type { InventoryEntry, Item } from '../../models/game.models';

export interface InventoryDialogData {
  characterId: string;
  sessionId: string;
}

// NOTE: This component's template/styles were already introduced verbatim back in
// Phase 6 (as supporting scaffolding, so GameConsoleComponent would compile and the
// Inventory dialog would open). This phase is where you build out its actual logic —
// the three action handlers below (equip, use, drop) are the focus.

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule, MatTabsModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, MatTooltipModule,
    MatDividerModule, MatBadgeModule, MatSnackBarModule,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent implements OnInit {
  private api     = inject(GameApiService);
  private snack   = inject(MatSnackBar);
  private charSvc = inject(CharacterStateService);
  private dialogRef = inject(MatDialogRef<InventoryComponent>);
  private data: InventoryDialogData = inject(MAT_DIALOG_DATA);

  loading       = signal(true);
  actionLoading = signal<number | null>(null);
  inventory     = signal<InventoryEntry[]>([]);

  character = this.charSvc.character;

  weapons     = computed(() => this.inventory().filter(e => e.item?.type === 'weapon'));
  armors      = computed(() => this.inventory().filter(e => e.item?.type === 'armor'));
  consumables = computed(() => this.inventory().filter(e => e.item?.type === 'potion' || e.item?.type === 'misc'));

  ngOnInit(): void {
    this.loadInventory();
  }

  private loadInventory(): void {
    this.loading.set(true);
    this.api.getInventory(this.data.characterId).subscribe({
      next: (res) => {
        this.inventory.set(res.inventory);
        this.charSvc.setInventory(res.inventory);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snack.open('Failed to load inventory', 'Dismiss', { duration: 3000 });
      },
    });
  }

  toggleEquip(entry: InventoryEntry): void {
    // TODO: Guard against overlapping calls (return early if actionLoading() !== null),
    //   then set actionLoading(entry.item_id) so the row shows a spinner.
    // TODO: Flip `entry.equipped` and call this.api.equipItem(this.data.characterId,
    //   entry.item_id, newEquipped). On success, refresh both this.inventory and
    //   this.charSvc.setInventory(...) from the response, clear actionLoading, and show
    //   a snack bar ("<name> equipped."/"<name> unequipped.").
    // TODO: On error, clear actionLoading and show the server's error message (or a
    //   generic fallback) in a snack bar.
  }

  usePotion(entry: InventoryEntry): void {
    // TODO: Guard against overlapping calls and bail out if there's no active
    //   character() or the item has no `effect.heal` (potions with no heal effect
    //   should just show an informational snack bar — nothing else to do client-side).
    // TODO: Parse the heal expression (e.g. "2d4+2") with a regex like
    //   /(\d+)d(\d+)(?:\+(\d+))?/, roll each die client-side, and sum with the bonus to
    //   get `healAmt`. Clamp `character.hp + healAmt` to `character.max_hp`.
    // TODO: Consume the potion — this reference implementation calls
    //   this.api.dropItem(this.data.characterId, entry.item_id) to remove one unit —
    //   then on success refresh inventory, patch the character's HP locally via
    //   this.charSvc.setCharacter({ ...char, hp: newHp }), clear actionLoading, and show
    //   a snack bar with the amount healed.
    // TODO: On error, clear actionLoading and show a failure snack bar.
  }

  dropItem(entry: InventoryEntry): void {
    // TODO: Guard against overlapping calls. Confirm with the user (a simple
    //   `confirm(...)` is fine) before dropping — this is a destructive action.
    // TODO: Set actionLoading(entry.item_id) and call this.api.dropItem(
    //   this.data.characterId, entry.item_id). On success, refresh this.inventory and
    //   this.charSvc.setInventory(...), clear actionLoading, and show a confirmation
    //   snack bar.
    // TODO: On error, clear actionLoading and show the server's error message (or a
    //   generic fallback) in a snack bar.
  }

  typeIcon(type: Item['type'] | undefined): string {
    switch (type) {
      case 'weapon':  return '⚔️';
      case 'armor':   return '🛡️';
      case 'potion':  return '⚗️';
      case 'misc':    return '📦';
      default:        return '❓';
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
