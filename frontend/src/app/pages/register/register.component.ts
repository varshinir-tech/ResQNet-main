import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-icon">📝</div>
          <h2>Create Account</h2>
          <p>Register as a Citizen or Coastal Emergency Responder</p>
        </div>

        @if (errorMessage) {
          <div class="alert alert-error">⚠️ {{ errorMessage }}</div>
        }

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              class="form-control"
              [(ngModel)]="name"
              required
              placeholder="e.g. Anand Shenoy"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              class="form-control"
              [(ngModel)]="email"
              required
              placeholder="e.g. anand@example.com"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password (min 6 characters)</label>
            <input
              type="password"
              id="password"
              name="password"
              class="form-control"
              [(ngModel)]="password"
              minlength="6"
              required
              placeholder="••••••••"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="phone">Phone / Mobile Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              class="form-control"
              [(ngModel)]="phone"
              required
              placeholder="+91 98765 43210"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="role">Registering As</label>
            <select id="role" name="role" class="form-control" [(ngModel)]="role">
              <option value="citizen">Citizen (Need Help / Community Member)</option>
              <option value="responder">Volunteer / First Responder</option>
            </select>
          </div>

          @if (role === 'responder') {
            <div class="form-group">
              <label class="form-label" for="skills">Skills & Expertise</label>
              <input
                type="text"
                id="skills"
                name="skills"
                class="form-control"
                [(ngModel)]="skillsString"
                placeholder="e.g. First Aid, Boat Rescue, Swimming (comma separated)"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="area">Primary Area of Operation</label>
              <input
                type="text"
                id="area"
                name="area"
                class="form-control"
                [(ngModel)]="areaOfOperation"
                placeholder="e.g. Kadri, Hampankatta, Surathkal"
              />
            </div>
          }

          <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading">
            @if (isLoading) {
              <span>Creating Account...</span>
            } @else {
              <span>Register Account</span>
            }
          </button>
        </form>

        <div class="auth-footer">
          Already registered?
          <a routerLink="/login" class="link-highlight">Sign in here</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 1.5rem 1rem;
    }
    .auth-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2.25rem;
      width: 100%;
      max-width: 500px;
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
export class RegisterComponent {
  auth = inject(AuthService);
  router = inject(Router);

  name = '';
  email = '';
  password = '';
  phone = '';
  role: 'citizen' | 'responder' = 'citizen';
  skillsString = '';
  areaOfOperation = 'Mangaluru City';

  isLoading = false;
  errorMessage = '';

  onSubmit(): void {
    if (!this.name || !this.email || !this.password) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const skills = this.skillsString
      ? this.skillsString.split(',').map((s) => s.trim()).filter((s) => !!s)
      : ['First Aid'];

    this.auth.register({
      name: this.name,
      email: this.email,
      password: this.password,
      phone: this.phone,
      role: this.role,
      skills,
      areaOfOperation: this.areaOfOperation
    }).subscribe({
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
        this.errorMessage = err.error?.message || 'Registration failed. Email may already be in use.';
      }
    });
  }
}
