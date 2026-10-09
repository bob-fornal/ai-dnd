import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { InventoryComponent } from './inventory.component';
import { GameApiService } from '../../services/game-api.service';
import { CharacterStateService } from '../../services/character-state.service';
import type { InventoryEntry } from '../../models/game.models';

const INVENTORY: InventoryEntry[] = [
  {
    id: 1, character_id: 'char-1', item_id: 10, quantity: 1, equipped: true,
    item: { id: 10, name: 'Longsword', type: 'weapon', effect: {}, value: 15, weight: 3 },
  },
  {
    id: 2, character_id: 'char-1', item_id: 20, quantity: 2, equipped: false,
    item: { id: 20, name: 'Healing Potion', type: 'potion', effect: { heal: '2d4+2' }, value: 50, weight: 0.5 },
  },
];

describe('InventoryComponent', () => {
  let fixture: ComponentFixture<InventoryComponent>;
  let component: InventoryComponent;
  let api: jasmine.SpyObj<GameApiService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<InventoryComponent>>;

  beforeEach(async () => {
    api = jasmine.createSpyObj('GameApiService', ['getInventory', 'equipItem', 'dropItem']);
    api.getInventory.and.returnValue(of({ inventory: INVENTORY }));
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        provideNoopAnimations(),
        { provide: GameApiService, useValue: api },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { characterId: 'char-1', sessionId: 'session-1' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the inventory on init and share it with the character state', () => {
    expect(api.getInventory).toHaveBeenCalledWith('char-1');
    expect(component.loading()).toBeFalse();
    expect(component.inventory().length).toBe(2);
    expect(TestBed.inject(CharacterStateService).inventory().length).toBe(2);
  });

  it('should group items by type', () => {
    expect(component.weapons().map(e => e.item?.name)).toEqual(['Longsword']);
    expect(component.armors().length).toBe(0);
    expect(component.consumables().map(e => e.item?.name)).toEqual(['Healing Potion']);
  });

  it('should render the loaded items', () => {
    expect(fixture.nativeElement.textContent).toContain('Longsword');
  });

  it('should close the dialog', () => {
    component.close();
    expect(dialogRef.close).toHaveBeenCalled();
  });
});
