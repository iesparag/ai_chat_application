import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
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
    MatButtonModule,
    MatSnackBarModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-card-title>Login</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form (ngSubmit)="onSubmit(loginForm)" #loginForm="ngForm">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput 
                     type="email" 
                     name="email" 
                     [(ngModel)]="email" 
                     required 
                     email
                     #emailControl="ngModel">
              <mat-error *ngIf="emailControl.hasError('required') && (emailControl.touched || loginForm.submitted)">
                Email is required.
              </mat-error>
              <mat-error *ngIf="emailControl.hasError('email') && (emailControl.touched || loginForm.submitted)">
                Enter a valid email address.
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput 
                     type="password" 
                     name="password" 
                     [(ngModel)]="password" 
                     required
                     #passwordControl="ngModel">
              <mat-error *ngIf="passwordControl.hasError('required') && (passwordControl.touched || loginForm.submitted)">
                Password is required.
              </mat-error>
            </mat-form-field>

            <div class="button-container">
              <button mat-raised-button 
                      color="primary" 
                      type="submit" 
                      [disabled]="isLoading">
                {{ isLoading ? 'Logging in...' : 'Login' }}
              </button>
              <button mat-button 
                      type="button" 
                      [disabled]="isLoading"
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
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  onSubmit(form: NgForm) {
    if (this.isLoading) return;

    if (form.invalid) {
      form.form.markAllAsTouched();
      this.showToast('Please fix the highlighted fields.', 'error-snackbar');
      return;
    }

    this.isLoading = true;
    this.authService.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.showToast('Welcome back.', 'success-snackbar');
        this.router.navigate(['/']);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.showToast(this.getErrorMessage(error), 'error-snackbar');
      }
    });
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Unable to connect to the server. Please check if backend is running.';
    }

    return error.error?.error || error.error?.message || 'Login failed. Please try again.';
  }

  private showToast(message: string, panelClass: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass
    });
  }
}
