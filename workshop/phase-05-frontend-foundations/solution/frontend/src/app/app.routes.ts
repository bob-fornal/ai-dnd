import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'characters',
    loadComponent: () =>
      import('./components/character-creation/character-creation.component').then(
        m => m.CharacterCreationComponent,
      ),
    canActivate: [authGuard],
  },
  // The 'game/:sessionId' route is added in Phase 6 once GameConsoleComponent exists.
  {
    path: '**',
    redirectTo: 'login',
  },
];
