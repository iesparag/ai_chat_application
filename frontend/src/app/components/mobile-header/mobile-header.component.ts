import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-mobile-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="mobile-header">
      <button mat-icon-button (click)="toggleSidebar.emit()">
        <mat-icon>menu</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .mobile-header {
      display: none;
      align-items: center;
      padding: 0.75rem;
      background-color: #343541;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    button {
      color: #ECECF1;
    }

    @media (max-width: 768px) {
      .mobile-header {
        display: flex;
      }
    }
  `]
})
export class MobileHeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
}
