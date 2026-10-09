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
    if (!this.username.trim()) {
      this.error.set('Please enter a name to continue.');
      return;
    }
    this.error.set('');
    this.auth.login(this.username);
    const campaigns = this.auth.profile()?.campaigns ?? [];
    if (campaigns.length === 0) {
      this.router.navigate(['/characters']);
    }
    // else stay on login to show campaign slots
  }

  newCampaign(): void {
    this.router.navigate(['/characters']);
  }

  resumeCampaign(slot: CampaignSlot): void {
    this.router.navigate(['/game', slot.sessionId]);
  }

  deleteCampaign(event: Event, slotId: string): void {
    event.stopPropagation();
    this.auth.removeCampaign(slotId);
  }

  switchUser(): void {
    this.auth.logout();
    this.username = '';
  }
}
