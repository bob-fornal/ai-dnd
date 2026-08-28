import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  // TODO: add a 'login' route that lazy-loads LoginComponent
  // TODO: add a 'characters' route that lazy-loads CharacterCreationComponent,
  //       protected by authGuard
  // The 'game/:sessionId' route is added in Phase 6 once GameConsoleComponent exists.
  {
    path: '**',
    redirectTo: 'login',
  },
];
