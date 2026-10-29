import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="profile-container">
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar-lg">{{ (user?.name || 'U')[0] }}</div>
          <div class="header-info">
            <h2>{{ user?.name }}</h2>
            <div class="role-pill" [ngClass]="'role-' + user?.role">{{ user?.role | uppercase }}</div>
          </div>
        </div>

        @if (successMessage) {
          <div class="alert alert-success">✅ {{ successMessage }}</div>
        }

        <form (ngSubmit)="saveProfile()" class="profile-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" [(ngModel)]="name" name="name" class="form-control" required />
          </div>

          <div class="form-group">
            <label class="form-label">Email Address (Read-Only)</label>
            <input type="email" [value]="user?.email" class="form-control" disabled />
          </div>

          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" [(ngModel)]="phone" name="phone" class="form-control" />
          </div>

          <div class="form-group">
            <label class="form-label">Address / Landmark in Mangaluru</label>
            <input type="text" [(ngModel)]="address" name="address" class="form-control" />
          </div>

          @if (user?.role === 'responder') {
            <div class="form-group">
              <label class="form-label">Duty Availability Status</label>
              <select [(ngModel)]="availability" name="avail" class="form-control">
                <option value="Available">Available for Dispatch</option>
                <option value="On Duty">On Active Duty</option>
                <option value="Busy">Busy / In Transit</option>
                <option value="Unavailable">Temporarily Unavailable</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Area of Operation</label>
              <input type="text" [(ngModel)]="areaOfOperation" name="area" class="form-control" />
            </div>
          }

          <button type="submit" class="btn btn-primary" [disabled]="isSaving">
            @if (isSaving) {
              <span>Updating Profile...</span>
            } @else {
              <span>Save Profile Changes</span>
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 600px;
      margin: 0 auto;
    }
    .profile-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: var(--shadow-sm);
    }
    .profile-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 1.25rem;
    }
    .avatar-lg {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--accent-teal);
      color: white;
      font-size: 1.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-info h2 {
      font-size: 1.35rem;
      color: var(--primary-color);
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .role-pill {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      display: inline-block;
      color: white;
    }
    .role-admin { background: #ef4444; }
    .role-responder { background: #3b82f6; }
    .role-citizen { background: #10b981; }

    .alert-success {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      margin-bottom: 1.25rem;
    }
    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `]
})
export class ProfileComponent implements OnInit {
  auth = inject(AuthService);
  user: User | null = null;

  name = '';
  phone = '';
  address = '';
  availability = 'Available';
  areaOfOperation = '';
  isSaving = false;
  successMessage = '';

  ngOnInit(): void {
    this.user = this.auth.currentUser();
    if (this.user) {
      this.name = this.user.name;
      this.phone = this.user.phone || '';
      this.address = this.user.address || '';
      this.availability = this.user.availability || 'Available';
      this.areaOfOperation = this.user.areaOfOperation || 'Mangaluru City';
    }
  }

  saveProfile(): void {
    this.isSaving = true;
    this.successMessage = '';

    this.auth.updateProfile({
      name: this.name,
      phone: this.phone,
      address: this.address,
      availability: this.availability,
      areaOfOperation: this.areaOfOperation
    }).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.user = res.user;
        this.successMessage = 'Profile updated successfully.';
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }
}
