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
    if (this.actionLoading() !== null) return;
    this.actionLoading.set(entry.item_id);
    const newEquipped = !entry.equipped;

    this.api.equipItem(this.data.characterId, entry.item_id, newEquipped).subscribe({
      next: (res) => {
        this.inventory.set(res.inventory);
        this.charSvc.setInventory(res.inventory);
        this.actionLoading.set(null);
        const name = entry.item?.name ?? 'Item';
        this.snack.open(
          newEquipped ? `${name} equipped.` : `${name} unequipped.`,
          undefined,
          { duration: 2000 }
        );
      },
      error: (err) => {
        this.actionLoading.set(null);
        this.snack.open(err?.error?.error ?? 'Failed to equip item', 'Dismiss', { duration: 3000 });
      },
    });
  }

  usePotion(entry: InventoryEntry): void {
    if (this.actionLoading() !== null) return;
    const char = this.character();
    if (!char) return;

    const effect = entry.item?.effect;
    if (!effect?.heal) {
      this.snack.open('This item has no direct use effect.', 'OK', { duration: 2500 });
      return;
    }

    this.actionLoading.set(entry.item_id);

    // Parse heal expression (e.g. "2d4+2") — simplified: pick average
    const healMatch = effect.heal.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    let healAmt = 4;
    if (healMatch) {
      const dice = parseInt(healMatch[1], 10);
      const sides = parseInt(healMatch[2], 10);
      const bonus = parseInt(healMatch[3] ?? '0', 10);
      // Roll each die
      healAmt = Array.from({ length: dice }, () => Math.floor(Math.random() * sides) + 1)
        .reduce((a, b) => a + b, 0) + bonus;
    }

    const newHp = Math.min(char.hp + healAmt, char.max_hp);

    this.api.dropItem(this.data.characterId, entry.item_id).subscribe({
      next: (res) => {
        this.inventory.set(res.inventory);
        this.charSvc.setInventory(res.inventory);
        // Update HP locally via a partial character update
        const updated = { ...char, hp: newHp };
        this.charSvc.setCharacter(updated);
        this.actionLoading.set(null);
        this.snack.open(
          `${entry.item?.name} used! Restored ${healAmt} HP. (${newHp}/${char.max_hp})`,
          undefined,
          { duration: 3000 }
        );
      },
      error: () => {
        this.actionLoading.set(null);
        this.snack.open('Failed to use item', 'Dismiss', { duration: 3000 });
      },
    });
  }

  dropItem(entry: InventoryEntry): void {
    if (this.actionLoading() !== null) return;
    const name = entry.item?.name ?? 'Item';
    if (!confirm(`Drop ${name}?`)) return;

    this.actionLoading.set(entry.item_id);
    this.api.dropItem(this.data.characterId, entry.item_id).subscribe({
      next: (res) => {
        this.inventory.set(res.inventory);
        this.charSvc.setInventory(res.inventory);
        this.actionLoading.set(null);
        this.snack.open(`${name} dropped.`, undefined, { duration: 2000 });
      },
      error: (err) => {
        this.actionLoading.set(null);
        this.snack.open(err?.error?.error ?? 'Failed to drop item', 'Dismiss', { duration: 3000 });
      },
    });
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
