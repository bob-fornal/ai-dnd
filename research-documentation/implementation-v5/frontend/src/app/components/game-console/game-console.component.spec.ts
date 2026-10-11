import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { GameConsoleComponent } from './game-console.component';
import { GameApiService } from '../../services/game-api.service';
import { AuthService } from '../../services/auth.service';
import type { Character } from '../../models/game.models';

const CHARACTER: Character = {
  id: 'char-1', session_id: 'session-1', name: 'Thorin',
  race: 'Dwarf', class: 'Fighter', level: 1, xp: 0,
  hp: 12, max_hp: 12, ac: 16, gold: 10,
  str: 16, dex: 12, con: 15, int: 8, wis: 10, cha: 9,
  created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
};

describe('GameConsoleComponent', () => {
  let fixture: ComponentFixture<GameConsoleComponent>;
  let api: jasmine.SpyObj<GameApiService>;

  function setup(sessionId: string | null): void {
    api = jasmine.createSpyObj('GameApiService', [
      'getSession', 'getInventory', 'getLog', 'sendAction', 'resolveCombat', 'levelUp',
    ]);
    api.getSession.and.returnValue(of({ session: { location: 'Millhaven' }, character: CHARACTER }));
    api.getInventory.and.returnValue(of({ inventory: [] }));
    api.getLog.and.returnValue(of({ entries: [], total: 0, page: 0 }));

    TestBed.configureTestingModule({
      imports: [GameConsoleComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: GameApiService, useValue: api },
        { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', ['updateCampaign'], { profile: () => null }) },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(sessionId ? { sessionId } : {}) } },
        },
      ],
    });

    fixture = TestBed.createComponent(GameConsoleComponent);
  }

  it('should create', () => {
    setup('session-1');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should read the session id from the route', () => {
    setup('session-1');
    fixture.detectChanges();
    expect(fixture.componentInstance.sessionId).toBe('session-1');
  });

  it('should redirect to /login when there is no session id', () => {
    setup(null);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(api.getSession).not.toHaveBeenCalled();
  });
});
