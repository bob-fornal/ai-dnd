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
  template: `
    <div class="inv-dialog">
      <h2 mat-dialog-title class="title-font">
        <mat-icon>inventory_2</mat-icon>
        Inventory
        <span class="gold-chip">{{ character()?.gold ?? 0 }} gp</span>
      </h2>

      <mat-dialog-content class="inv-content">

        @if (loading()) {
          <div class="loading-center">
            <mat-spinner diameter="40" />
            <p>Loading inventory…</p>
          </div>
        } @else {

          <mat-tab-group animationDuration="150ms">

            <!-- ── ALL ──────────────────────────────────────────── -->
            <mat-tab label="All ({{ inventory().length }})">
              <ng-container *ngTemplateOutlet="itemList; context: { items: inventory() }" />
            </mat-tab>

            <!-- ── WEAPONS ──────────────────────────────────────── -->
            <mat-tab label="Weapons ({{ weapons().length }})">
              <ng-container *ngTemplateOutlet="itemList; context: { items: weapons() }" />
            </mat-tab>

            <!-- ── ARMOR ────────────────────────────────────────── -->
            <mat-tab label="Armor ({{ armors().length }})">
              <ng-container *ngTemplateOutlet="itemList; context: { items: armors() }" />
            </mat-tab>

            <!-- ── POTIONS / MISC ───────────────────────────────── -->
            <mat-tab label="Consumables ({{ consumables().length }})">
              <ng-container *ngTemplateOutlet="itemList; context: { items: consumables() }" />
            </mat-tab>

          </mat-tab-group>

        }

      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="close()">Close</button>
      </mat-dialog-actions>
    </div>

    <!-- ── Item list template ─────────────────────────────────────── -->
    <ng-template #itemList let-items="items">
      @if (items.length === 0) {
        <p class="empty-msg text-muted">Nothing here.</p>
      }
      <div class="item-list">
        @for (entry of items; track entry.item_id) {
          <div class="item-card" [class.equipped]="entry.equipped">

            <div class="item-icon">
              {{ typeIcon(entry.item?.type) }}
            </div>

            <div class="item-body">
              <div class="item-name">
                {{ entry.item?.name ?? 'Unknown Item' }}
                @if (entry.equipped) {
                  <span class="equipped-badge">Equipped</span>
                }
                @if (entry.quantity > 1) {
                  <span class="qty-badge">×{{ entry.quantity }}</span>
                }
              </div>

              <div class="item-stats">
                @if (entry.item?.effect?.damage) {
                  <span class="stat">⚔ {{ entry.item!.effect.damage }}</span>
                }
                @if (entry.item?.effect?.ac_bonus) {
                  <span class="stat">🛡 +{{ entry.item!.effect.ac_bonus }} AC</span>
                }
                @if (entry.item?.effect?.attack_bonus) {
                  <span class="stat">🎯 +{{ entry.item!.effect.attack_bonus }} ATK</span>
                }
                @if (entry.item?.effect?.heal) {
                  <span class="stat">💚 Heals {{ entry.item!.effect.heal }}</span>
                }
                @if (entry.item?.effect?.magic) {
                  <span class="stat magic">✨ Magical</span>
                }
                <span class="stat value">{{ entry.item?.value ?? 0 }} gp</span>
              </div>
            </div>

            <div class="item-actions">
              <!-- Equip / Unequip for weapon & armor -->
              @if (entry.item?.type === 'weapon' || entry.item?.type === 'armor') {
                <button mat-icon-button
                        [matTooltip]="entry.equipped ? 'Unequip' : 'Equip'"
                        [disabled]="actionLoading() === entry.item_id"
                        (click)="toggleEquip(entry)">
                  @if (actionLoading() === entry.item_id) {
                    <mat-spinner diameter="18" />
                  } @else {
                    <mat-icon>{{ entry.equipped ? 'remove_circle_outline' : 'check_circle_outline' }}</mat-icon>
                  }
                </button>
              }

              <!-- Use potion (outside combat context notice handled by DM narrative) -->
              @if (entry.item?.type === 'potion') {
                <button mat-icon-button
                        color="accent"
                        matTooltip="Use Potion"
                        [disabled]="actionLoading() === entry.item_id"
                        (click)="usePotion(entry)">
                  @if (actionLoading() === entry.item_id) {
                    <mat-spinner diameter="18" />
                  } @else {
                    <mat-icon>local_pharmacy</mat-icon>
                  }
                </button>
              }

              <!-- Drop -->
              <button mat-icon-button
                      color="warn"
                      matTooltip="Drop Item"
                      [disabled]="actionLoading() === entry.item_id"
                      (click)="dropItem(entry)">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </div>

          </div>

          <mat-divider />
        }
      </div>
    </ng-template>
  `,
  styles: [`
    :host {
      --gold: #c9a84c;
      --purple-light: #b39ddb;
      --border: rgba(201,168,76,.25);
      --surface: #1a1215;
      --text: #e8dcc8;
      --text-muted: #8d7b68;
    }

    .inv-dialog {
      background: var(--surface);
      min-width: min(540px, 95vw);
      max-width: 640px;
    }

    [mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: .5rem;
      font-family: 'Cinzel', serif;
      color: var(--gold);
      font-size: 1.1rem;
      padding: 1rem 1.5rem .5rem;
      margin: 0;
    }

    .gold-chip {
      margin-left: auto;
      background: rgba(201,168,76,.15);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: .15rem .7rem;
      font-size: .85rem;
      color: var(--gold);
    }

    .inv-content {
      max-height: 60vh;
      overflow-y: auto;
      padding: 0 1.5rem 1rem;
    }

    .loading-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      color: var(--text-muted);
    }

    .empty-msg {
      text-align: center;
      padding: 2rem;
      font-style: italic;
    }

    .item-list {
      display: flex;
      flex-direction: column;
    }

    .item-card {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .65rem .25rem;
      transition: background .15s;

      &.equipped {
        background: rgba(201,168,76,.05);
      }
    }

    .item-icon {
      font-size: 1.4rem;
      width: 2rem;
      text-align: center;
      flex-shrink: 0;
    }

    .item-body {
      flex: 1;
      min-width: 0;
    }

    .item-name {
      font-weight: 500;
      color: var(--text);
      font-size: .9rem;
      display: flex;
      align-items: center;
      gap: .5rem;
      flex-wrap: wrap;
    }

    .equipped-badge {
      background: rgba(201,168,76,.2);
      color: var(--gold);
      font-size: .65rem;
      padding: .1rem .4rem;
      border-radius: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .03em;
    }

    .qty-badge {
      background: rgba(179,157,219,.15);
      color: var(--purple-light);
      font-size: .65rem;
      padding: .1rem .4rem;
      border-radius: 8px;
    }

    .item-stats {
      display: flex;
      flex-wrap: wrap;
      gap: .35rem;
      margin-top: .2rem;
    }

    .stat {
      font-size: .72rem;
      color: var(--text-muted);
      background: rgba(255,255,255,.04);
      padding: .1rem .4rem;
      border-radius: 4px;

      &.magic { color: #ce93d8; }
      &.value { color: var(--gold); }
    }

    .item-actions {
      display: flex;
      align-items: center;
      gap: .1rem;
      flex-shrink: 0;
    }

    ::ng-deep {
      .mat-mdc-tab-body-content { padding: .5rem 0 0; }
      .mat-mdc-dialog-content { max-height: unset; }
    }
  `],
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
