import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AppBarComponent } from './components/app-bar/app-bar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, AppBarComponent],
  template: `
    <div *ngIf="isAuthenticated; else authPages" class="app-container">
      <app-app-bar (toggleMenu)="toggleSidebar()"></app-app-bar>

      <div class="main-area">
        <app-sidebar class="sidebar" [class.open]="isSidebarOpen"></app-sidebar>

        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>

        <div
          class="sidebar-overlay"
          [class.visible]="isSidebarOpen"
          (click)="toggleSidebar()"
        ></div>
      </div>
    </div>

    <ng-template #authPages>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      background-color: #343541;
    }

    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      position: relative;
      background-color: #343541;
    }

    .main-area {
      display: flex;
      min-height: 0;
      flex: 1;
      position: relative;
    }

    .sidebar {
      width: 260px;
      height: 100%;
      flex-shrink: 0;
      background-color: #202123;
      border-right: 1px solid rgba(255,255,255,0.1);
      z-index: 1000;
      transition: transform 0.3s ease;
    }

    .content-wrapper {
      flex: 1;
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      background-color: #343541;
    }

    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      opacity: 0;
      transition: opacity 0.3s ease;
      backdrop-filter: blur(2px);
    }

    .sidebar-overlay.visible {
      opacity: 1;
    }

    @media (max-width: 1024px) {
      .sidebar {
        width: 240px;
      }
    }

    @media (max-width: 768px) {
      .app-container {
        position: fixed;
        width: 100%;
        height: 100%;
      }

      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        width: 85%;
        max-width: 300px;
        transform: translateX(-100%);
        box-shadow: 2px 0 12px rgba(0,0,0,0.3);
        z-index: 1002; /* Higher than input area */
      }

      .sidebar.open {
        transform: translateX(0);
      }

      .content-wrapper {
        margin-left: 0;
        width: 100%;
        padding-top: 0;
      }

      .sidebar-overlay {
        display: block;
        z-index: 1000; /* Lower than input area but higher than other content */
      }

      .sidebar-overlay.visible {
        pointer-events: auto;
        opacity: 1;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'AI Chat';
  isSidebarOpen = false;
  isAuthenticated = false;

  constructor(private authService: AuthService) {}

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  ngOnInit() {
    this.authService.isAuthenticatedAsObservable().subscribe(
      (isAuth: boolean) => this.isAuthenticated = isAuth
    );
  }
}
