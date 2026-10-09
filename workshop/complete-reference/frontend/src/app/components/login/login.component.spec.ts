import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import type { UserProfile } from '../../models/game.models';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let profile: WritableSignal<UserProfile | null>;

  beforeEach(async () => {
    profile = signal<UserProfile | null>(null);
    const auth = {
      profile: profile.asReadonly(),
      login: jasmine.createSpy('login'),
      logout: jasmine.createSpy('logout'),
      removeCampaign: jasmine.createSpy('removeCampaign'),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show the name entry card when no profile is loaded', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Enter the World');
    expect(fixture.nativeElement.querySelector('input')).not.toBeNull();
  });

  it('should list saved campaigns when a profile is loaded', () => {
    profile.set({
      username: 'Aldric',
      campaigns: [{
        slotId: 'slot-1',
        characterName: 'Thorin',
        characterClass: 'Fighter',
        characterRace: 'Dwarf',
        level: 3,
        sessionId: 'session-1',
        characterId: 'char-1',
        lastPlayed: '2026-01-01T00:00:00.000Z',
        location: 'Millhaven',
      }],
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Welcome back, Aldric');
    expect(fixture.nativeElement.querySelectorAll('.campaign-slot').length).toBe(1);
    expect(text).toContain('Thorin');
  });
});
