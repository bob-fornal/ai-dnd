import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { CharacterCreationComponent } from './character-creation.component';
import { GameApiService } from '../../services/game-api.service';
import { AuthService } from '../../services/auth.service';

describe('CharacterCreationComponent', () => {
  let fixture: ComponentFixture<CharacterCreationComponent>;
  let component: CharacterCreationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterCreationComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: GameApiService, useValue: jasmine.createSpyObj('GameApiService', ['createCharacter']) },
        { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', ['addCampaign']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the wizard title', () => {
    expect(fixture.nativeElement.textContent).toContain('Forge Your Legend');
  });

  it('should only allow creation once name, race, and class are chosen', () => {
    expect(component.canCreate()).toBeFalse();

    component.name.set('Thorin');
    component.race.set('Dwarf');
    expect(component.canCreate()).toBeFalse();

    component.characterClass.set('Fighter');
    expect(component.canCreate()).toBeTrue();
  });

  it('should not allow a whitespace-only name', () => {
    component.name.set('   ');
    component.race.set('Elf');
    component.characterClass.set('Wizard');
    expect(component.canCreate()).toBeFalse();
  });
});
