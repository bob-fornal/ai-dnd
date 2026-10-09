import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import type { CampaignSlot } from '../../models/game.models';

// FOCUS FILE — the template/styles below are complete (HTML/CSS isn't this
// workshop's teaching focus). Your job is just the class body: wire each
// method up to AuthService and the Router.

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule,
    MatCardModule, MatDividerModule, MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  username = '';
  error    = signal('');
  profile  = this.auth.profile;

  login(): void {
    // TODO: validate `username`, set an error message via `error.set(...)` if
    // blank, otherwise call `this.auth.login(this.username)`. If the
    // resulting profile has no saved campaigns, navigate to '/characters'.
  }

  newCampaign(): void {
    // TODO: navigate to '/characters'
  }

  resumeCampaign(slot: CampaignSlot): void {
    // TODO: navigate to ['/game', slot.sessionId]
  }

  deleteCampaign(event: Event, slotId: string): void {
    // TODO: stop the click from bubbling into resumeCampaign(), then remove
    // the campaign via `this.auth.removeCampaign(slotId)`
  }

  switchUser(): void {
    // TODO: log out via AuthService and reset the local `username` field
  }
}
