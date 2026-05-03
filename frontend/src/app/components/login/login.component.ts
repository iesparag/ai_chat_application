import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
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
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="auth-container">
      <section class="auth-shell" aria-labelledby="login-title">
        <div class="brand-panel">
          <div class="brand-mark">IES</div>
          <h1>Parag GPT</h1>
          <p>Continue your chats with a cleaner, faster sign in.</p>
          <div class="status-pill">
            <span></span>
            Secure workspace
          </div>
        </div>

        <mat-card class="auth-card">
          <mat-card-header>
            <mat-card-title id="login-title">Welcome Back</mat-card-title>
            <mat-card-subtitle>Login to continue to your AI chat workspace.</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div *ngIf="errorMessage" class="auth-alert" role="alert">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage }}</span>
            </div>

            <form (ngSubmit)="onSubmit(loginForm)" #loginForm="ngForm" novalidate>
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput 
                     type="email" 
                     name="email" 
                     [(ngModel)]="email" 
                     required 
                     email
                     autocomplete="email"
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
                     [type]="showPassword ? 'text' : 'password'" 
                     name="password" 
                     [(ngModel)]="password" 
                     required
                     autocomplete="current-password"
                     #passwordControl="ngModel">
              <button mat-icon-button matSuffix type="button" class="visibility-button" [disabled]="isLoading" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'">
                <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="passwordControl.hasError('required') && (passwordControl.touched || loginForm.submitted)">
                Password is required.
              </mat-error>
            </mat-form-field>

            <div class="button-container">
              <button mat-raised-button 
                      color="primary" 
                      type="submit" 
                      class="primary-action"
                      [disabled]="isLoading">
                <span *ngIf="isLoading" class="button-spinner" aria-hidden="true"></span>
                {{ isLoading ? 'Checking...' : 'Login' }}
              </button>
              <button mat-button 
                      type="button" 
                      class="secondary-action"
                      [disabled]="isLoading"
                      (click)="goToSignup()">
                Create Account
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
      </section>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 24px;
      background:
        radial-gradient(circle at 18% 18%, rgba(16, 163, 127, 0.18), transparent 28%),
        linear-gradient(135deg, #202123 0%, #343541 58%, #2a2b32 100%);
      color: #ffffff;
    }

    .auth-shell {
      width: min(940px, 100%);
      display: grid;
      grid-template-columns: minmax(0, 1fr) 430px;
      gap: 28px;
      align-items: stretch;
    }

    .brand-panel {
      min-height: 460px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 36px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      background: rgba(32, 33, 35, 0.72);
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
    }

    .brand-mark {
      width: 52px;
      height: 52px;
      display: grid;
      place-items: center;
      margin-bottom: 24px;
      border-radius: 8px;
      background: #10a37f;
      color: #ffffff;
      font-weight: 700;
      letter-spacing: 0;
    }

    h1 {
      margin: 0 0 12px;
      font-size: 42px;
      line-height: 1.05;
      font-weight: 700;
      letter-spacing: 0;
    }

    .brand-panel p {
      max-width: 440px;
      margin: 0;
      color: rgba(255, 255, 255, 0.76);
      font-size: 17px;
    }

    .status-pill {
      width: fit-content;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 28px;
      padding: 8px 12px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 999px;
      color: rgba(255, 255, 255, 0.78);
      font-size: 13px;
    }

    .status-pill span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10a37f;
    }

    .auth-card {
      width: 100%;
      padding: 24px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
    }

    mat-card-header {
      padding: 0 0 22px;
    }

    mat-card-title {
      margin: 0 0 6px;
      color: #202123;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0;
    }

    mat-card-subtitle {
      color: #6b7280;
      font-size: 14px;
    }

    mat-card-content {
      padding: 0;
    }

    .auth-alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 16px;
      padding: 12px 14px;
      border: 1px solid rgba(179, 38, 30, 0.28);
      border-radius: 8px;
      background: #fff4f2;
      color: #9f1d17;
      font-size: 14px;
      line-height: 1.4;
    }

    .auth-alert mat-icon {
      width: 20px;
      height: 20px;
      font-size: 20px;
      flex: 0 0 auto;
    }

    mat-form-field {
      width: 100%;
      margin-bottom: 14px;
    }

    .visibility-button {
      color: #5f6368;
    }

    .button-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
      margin-top: 8px;
    }

    .primary-action,
    .secondary-action {
      width: 100%;
      min-height: 44px;
      border-radius: 6px;
      letter-spacing: 0 !important;
    }

    .primary-action {
      background: #10a37f !important;
      color: #ffffff !important;
    }

    .button-spinner {
      width: 16px;
      height: 16px;
      display: inline-block;
      margin-right: 8px;
      border: 2px solid rgba(255, 255, 255, 0.42);
      border-top-color: #ffffff;
      border-radius: 50%;
      vertical-align: -3px;
      animation: spin 0.75s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 760px) {
      .auth-container {
        padding: 16px;
        align-items: flex-start;
      }

      .auth-shell {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .brand-panel {
        min-height: auto;
        padding: 22px;
      }

      h1 {
        font-size: 32px;
      }

      .auth-card {
        padding: 20px;
      }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  showPassword = false;
  errorMessage = '';

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

    this.errorMessage = '';
    this.isLoading = true;
    this.authService.login(this.email.trim().toLowerCase(), this.password).pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: () => {
        this.showToast('Welcome back.', 'success-snackbar');
        this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error);
        this.showToast(this.errorMessage, 'error-snackbar');
      }
    });
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }

  private getErrorMessage(error: unknown): string {
    if (this.isTimeoutError(error)) {
      return 'Login is taking longer than expected. Please try again in a moment.';
    }

    const httpError = error as HttpErrorResponse;
    if (httpError.status === 0) {
      return 'Unable to connect to the server. Please try again shortly.';
    }

    return httpError.error?.error || httpError.error?.message || 'Login failed. Please try again.';
  }

  private isTimeoutError(error: unknown): boolean {
    return !!error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'TimeoutError';
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
