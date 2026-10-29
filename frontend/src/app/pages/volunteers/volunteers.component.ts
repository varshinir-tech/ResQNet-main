import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Volunteer, Incident } from '../../models';

@Component({
  selector: 'app-volunteers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="volunteers-container">
      <div class="page-top">
        <div>
          <h2>🤝 Volunteer & First Responder Mobilization</h2>
          <p>Mangaluru volunteer coordination, specialized skills, and incident task assignments.</p>
        </div>
        <button class="btn btn-primary" (click)="openRegisterModal()">+ Register as Volunteer</button>
      </div>

      <div class="demo-notice">
        <span class="badge badge-demo">DEMO DATA NOTICE</span>
        <span>Volunteer records are simulated for academic demonstration. Contact details are masked for public privacy.</span>
      </div>

      <!-- Volunteers Table / Grid -->
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Volunteer Name</th>
              <th>Skills & Specialties</th>
              <th>Availability</th>
              <th>Operating Area</th>
              <th>Assigned Mission</th>
              @if (auth.isAdmin()) {
                <th>Contact</th>
                <th>Actions</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (v of volunteers; track v._id) {
              <tr>
                <td>
                  <strong>{{ v.name }}</strong>
                  @if (v.isDemoData) {
                    <span class="badge badge-demo badge-mini">Demo</span>
                  }
                </td>
                <td>
                  <div class="skills-wrap">
                    @for (s of v.skills; track s) {
                      <span class="skill-tag">{{ s }}</span>
                    }
                  </div>
                </td>
                <td>
                  <span class="badge" [ngClass]="getAvailClass(v.availability)">{{ v.availability }}</span>
                </td>
                <td>{{ v.areaOfOperation }}</td>
                <td>
                  @if (v.assignedIncidentTitle || v.assignedIncident) {
                    <span class="assigned-task">🚨 {{ v.assignedIncidentTitle || 'Active Mission' }}</span>
                  } @else {
                    <span class="text-muted">Unassigned / Standby</span>
                  }
                </td>
                @if (auth.isAdmin()) {
                  <td>
                    <div class="contact-sm">
                      <div>{{ v.phone }}</div>
                      <small>{{ v.email }}</small>
                    </div>
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="btn btn-outline btn-xs" (click)="openAssignModal(v)">Assign Mission</button>
                      <button class="btn btn-danger btn-xs" (click)="deleteVolunteer(v._id)">Remove</button>
                    </div>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Volunteer Self-Registration Modal -->
      @if (showRegisterModal) {
        <div class="modal-backdrop">
          <div class="modal-box">
            <div class="modal-header">
              <h3>Volunteer Registration</h3>
              <button class="close-btn" (click)="showRegisterModal = false">✕</button>
            </div>
            <form (ngSubmit)="submitVolunteer()">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" [(ngModel)]="newVol.name" name="name" class="form-control" required />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" [(ngModel)]="newVol.email" name="email" class="form-control" required />
              </div>
              <div class="form-group">
                <label class="form-label">Phone</label>
                <input type="tel" [(ngModel)]="newVol.phone" name="phone" class="form-control" required />
              </div>
              <div class="form-group">
                <label class="form-label">Skills (comma separated)</label>
                <input type="text" [(ngModel)]="skillsInput" name="skills" class="form-control" placeholder="First Aid, Boat Operations, Food Prep" required />
              </div>
              <div class="form-group">
                <label class="form-label">Operating Area in Mangaluru</label>
                <input type="text" [(ngModel)]="newVol.areaOfOperation" name="area" class="form-control" required />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline" (click)="showRegisterModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary">Submit Registration</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Admin Assign Modal -->
      @if (showAssignModal && selectedVol) {
        <div class="modal-backdrop">
          <div class="modal-box">
            <div class="modal-header">
              <h3>Assign Mission to {{ selectedVol.name }}</h3>
              <button class="close-btn" (click)="showAssignModal = false">✕</button>
            </div>
            <div class="form-group">
              <label class="form-label">Select Active Mangaluru Incident</label>
              <select [(ngModel)]="targetIncidentId" class="form-control">
                <option value="">-- Remove from mission (Standby) --</option>
                @for (inc of activeIncidents; track inc._id) {
                  <option [value]="inc._id">{{ inc.title }} ({{ inc.status }})</option>
                }
              </select>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="showAssignModal = false">Cancel</button>
              <button type="button" class="btn btn-primary" (click)="saveAssignment()">Save Assignment</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .volunteers-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .page-top h2 {
      font-size: 1.4rem;
      color: var(--primary-color);
      font-weight: 700;
    }
    .page-top p {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .demo-notice {
      background: #fffbeb;
      border: 1px solid #fde68a;
      padding: 0.65rem 1rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.8rem;
      color: #92400e;
      margin-bottom: 1.5rem;
    }
    .table-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow-x: auto;
      box-shadow: var(--shadow-sm);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      text-align: left;
    }
    .data-table th {
      background: #f8fafc;
      padding: 0.85rem 1rem;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid var(--border-color);
    }
    .data-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }
    .skills-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    .skill-tag {
      background: #e2e8f0;
      color: #334155;
      font-size: 0.7rem;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }
    .assigned-task {
      color: #b91c1c;
      font-weight: 600;
      font-size: 0.8rem;
    }
    .action-btns {
      display: flex;
      gap: 0.35rem;
    }
    .badge-mini {
      font-size: 0.6rem;
      margin-left: 0.25rem;
    }
    .contact-sm small {
      color: var(--text-muted);
    }
    .btn-xs {
      padding: 0.2rem 0.45rem;
      font-size: 0.75rem;
    }
    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-box {
      background: white;
      width: 100%;
      max-width: 480px;
      border-radius: 10px;
      padding: 1.5rem;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .close-btn {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `]
})
export class VolunteersComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  volunteers: Volunteer[] = [];
  activeIncidents: Incident[] = [];

  showRegisterModal = false;
  showAssignModal = false;
  selectedVol: Volunteer | null = null;
  targetIncidentId = '';

  newVol: Partial<Volunteer> = {
    name: '',
    email: '',
    phone: '',
    areaOfOperation: 'Mangaluru City'
  };
  skillsInput = 'First Aid, Relief Distribution';

  ngOnInit(): void {
    this.loadVolunteers();
    if (this.auth.isAdmin()) {
      this.api.getIncidents().subscribe({
        next: (res) => {
          if (res.success) {
            this.activeIncidents = res.data;
            this.cdr.markForCheck();
          }
        }
      });
    }
  }

  loadVolunteers(): void {
    this.api.getVolunteers().subscribe({
      next: (res) => {
        if (res.success) {
          this.volunteers = res.data;
          this.cdr.markForCheck();
        }
      }
    });
  }

  getAvailClass(avail: string): string {
    switch (avail) {
      case 'Available': return 'badge-resolved';
      case 'On Duty': return 'badge-high';
      default: return 'badge-low';
    }
  }

  openRegisterModal(): void {
    const user = this.auth.currentUser();
    this.newVol = {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      areaOfOperation: user?.areaOfOperation || 'Mangaluru City'
    };
    this.showRegisterModal = true;
  }

  submitVolunteer(): void {
    const skills = this.skillsInput.split(',').map((s) => s.trim()).filter((s) => !!s);
    this.api.createVolunteer({
      ...this.newVol,
      skills
    }).subscribe({
      next: () => {
        this.showRegisterModal = false;
        this.loadVolunteers();
      }
    });
  }

  openAssignModal(v: Volunteer): void {
    this.selectedVol = v;
    this.targetIncidentId = typeof v.assignedIncident === 'string'
      ? v.assignedIncident
      : (v.assignedIncident?._id || '');
    this.showAssignModal = true;
  }

  saveAssignment(): void {
    if (!this.selectedVol) return;
    this.api.updateVolunteer(this.selectedVol._id, {
      assignedIncidentId: this.targetIncidentId
    }).subscribe({
      next: () => {
        this.showAssignModal = false;
        this.loadVolunteers();
      }
    });
  }

  deleteVolunteer(id: string): void {
    if (confirm('Delete this volunteer record?')) {
      this.api.deleteVolunteer(id).subscribe({
        next: () => this.loadVolunteers()
      });
    }
  }
}
