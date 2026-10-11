import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CharacterSheetComponent } from './character-sheet.component';
import { CharacterStateService } from '../../services/character-state.service';
import type { Character } from '../../models/game.models';

const CHARACTER: Character = {
  id: 'char-1', session_id: 'session-1', name: 'Thorin',
  race: 'Dwarf', class: 'Fighter', level: 2, xp: 400,
  hp: 18, max_hp: 20, ac: 16, gold: 25,
  str: 16, dex: 12, con: 15, int: 8, wis: 10, cha: 9,
  created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
};

describe('CharacterSheetComponent', () => {
  let fixture: ComponentFixture<CharacterSheetComponent>;
  let state: CharacterStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterSheetComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    state = TestBed.inject(CharacterStateService);
    fixture = TestBed.createComponent(CharacterSheetComponent);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render nothing when there is no character', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sheet')).toBeNull();
  });

  it('should render the active character', () => {
    state.setCharacter(CHARACTER);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Thorin');
    expect(text).toMatch(/Level 2\s+Dwarf\s+Fighter/);
  });
});
