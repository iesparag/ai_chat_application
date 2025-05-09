import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MobileHeaderComponent } from './components/mobile-header/mobile-header.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, MobileHeaderComponent],
  template: `
    <div *ngIf="isAuthenticated" class="app-container">
      <app-mobile-header (toggleSidebar)="toggleSidebar()"></app-mobile-header>
      <app-sidebar class="sidebar" [class.open]="isSidebarOpen"></app-sidebar>
      <div class="content-wrapper">
        <router-outlet></router-outlet>
      </div>
      <div class="sidebar-overlay" 
           [class.visible]="isSidebarOpen" 
           (click)="toggleSidebar()"></div>
    </div>
    <router-outlet *ngIf="!isAuthenticated"></router-outlet>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      background-color: #343541;
    }

    .app-container {
      display: flex;
      height: 100vh;
      overflow: hidden;
      position: relative;
      background-color: #343541;
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
        z-index: 999;
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
