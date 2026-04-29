import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-app-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule
  ],
  template: `
    <mat-toolbar class="app-bar">
      <button
        mat-icon-button
        class="menu-btn"
        (click)="toggleMenu.emit()"
        aria-label="Toggle menu"
      >
        <mat-icon>menu</mat-icon>
      </button>

      <span class="app-title">AI Chat</span>

      <span class="spacer"></span>

      <div class="user-info">
        <mat-icon class="user-icon">person</mat-icon>
        <span class="user-name">
          {{ (user$ | async)?.name || 'Logged in' }}
        </span>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .app-bar {
      background-color: #202123 !important;
      color: #ECECF1;
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      padding: 0 1rem;
      min-height: 56px;
      flex-shrink: 0;
    }

    .menu-btn {
      color: #ECECF1;
      margin-right: 0.5rem;
    }

    .app-title {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .spacer {
      flex: 1;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 8px;
    }

    .user-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #10a37f;
    }

    .user-name {
      font-size: 0.9rem;
      font-weight: 500;
      color: #ECECF1;
    }

    @media (min-width: 769px) {
      .menu-btn {
        display: none;
      }
    }
  `]
})
export class AppBarComponent {
  @Output() toggleMenu = new EventEmitter<void>();

  user$: Observable<{ id: string; name: string; email: string } | null>;

  constructor(private authService: AuthService) {
    this.user$ = this.authService.getUser();
  }
}