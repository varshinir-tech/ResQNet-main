import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-icon">🛡️</div>
          <h2>Portal Login</h2>
          <p>Access ResQ Mangaluru Disaster Response System</p>
        </div>

        @if (errorMessage) {
          <div class="alert alert-error">
            <span>⚠️ {{ errorMessage }}</span>
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              class="form-control"
              [(ngModel)]="email"
              required
              placeholder="e.g. admin@resqmangaluru.org"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              class="form-control"
              [(ngModel)]="password"
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading">
            @if (isLoading) {
              <span>Authenticating...</span>
            } @else {
              <span>Sign In to Dashboard</span>
            }
          </button>
        </form>

        <!-- Quick Demo Fill Section for Evaluators -->
        <div class="demo-fill-box">
          <span class="demo-tag">🎓 Quick-Fill Evaluator Credentials:</span>
          <div class="demo-buttons">
            <button type="button" class="btn btn-outline btn-xs role-admin-btn" (click)="fillDemo('admin')">
              Admin Fill
            </button>
            <button type="button" class="btn btn-outline btn-xs role-resp-btn" (click)="fillDemo('responder')">
              Responder Fill
            </button>
            <button type="button" class="btn btn-outline btn-xs role-cit-btn" (click)="fillDemo('citizen')">
              Citizen Fill
            </button>
          </div>
        </div>

        <div class="auth-footer">
          Don't have an account?
          <a routerLink="/register" class="link-highlight">Register as Citizen or Responder</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 75vh;
      padding: 1rem;
    }

    .auth-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2.25rem;
      width: 100%;
      max-width: 440px;
      box-shadow: var(--shadow-md);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .auth-icon {
      font-size: 2.2rem;
      margin-bottom: 0.5rem;
    }

    .auth-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .auth-header p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .alert-error {
      background-color: #fee2e2;
      border: 1px solid #fecaca;
      color: #991b1b;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      margin-bottom: 1.25rem;
    }

    .btn-block {
      width: 100%;
      padding: 0.75rem;
      font-size: 0.95rem;
      margin-top: 0.5rem;
    }

    .demo-fill-box {
      margin-top: 1.5rem;
      padding: 0.85rem;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
    }

    .demo-tag {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      margin-bottom: 0.5rem;
    }

    .demo-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      flex: 1;
    }

    .role-admin-btn:hover { background: #fee2e2; color: #991b1b; }
    .role-resp-btn:hover { background: #dbeafe; color: #1e40af; }
    .role-cit-btn:hover { background: #d1fae5; color: #065f46; }

    .auth-footer {
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
    }

    .link-highlight {
      color: var(--accent-blue);
      font-weight: 600;
      margin-left: 0.25rem;
    }
  `]
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);

  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  fillDemo(role: 'admin' | 'responder' | 'citizen'): void {
    if (role === 'admin') {
      this.email = 'admin@resqmangaluru.org';
      this.password = 'AdminPassword123!';
    } else if (role === 'responder') {
      this.email = 'responder@resqmangaluru.org';
      this.password = 'ResponderPass123!';
    } else {
      this.email = 'citizen@resqmangaluru.org';
      this.password = 'CitizenPass123!';
    }
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.user.role === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/citizen-dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Login failed. Please check credentials or MongoDB connection.';
      }
    });
  }
}
