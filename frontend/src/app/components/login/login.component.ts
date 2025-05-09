import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Login</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput 
                     type="email" 
                     name="email" 
                     [(ngModel)]="email" 
                     required 
                     email>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput 
                     type="password" 
                     name="password" 
                     [(ngModel)]="password" 
                     required>
            </mat-form-field>

            <div class="button-container">
              <button mat-raised-button 
                      color="primary" 
                      type="submit" 
                      [disabled]="!loginForm.form.valid">
                Login
              </button>
              <button mat-button 
                      type="button" 
                      (click)="goToSignup()">
                Create Account
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #343541;
    }

    .auth-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }

    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .button-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
    }

    mat-card-title {
      margin-bottom: 20px;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (this.email && this.password) {
      this.authService.login(this.email, this.password).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Login failed:', error);
          // You might want to show an error message to the user here
        }
      });
    }
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }
}
