import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Shelter } from '../../models';

@Component({
  selector: 'app-shelters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="shelters-page">
      <div class="page-header">
        <div>
          <h2>⛺ Evacuation Shelters & Relief Camps</h2>
          <p>Mangaluru district operational relief shelters, real-time capacities, and emergency provisions.</p>
        </div>
        @if (auth.isAdmin()) {
          <button class="btn btn-primary" (click)="openAddModal()">+ Add New Shelter</button>
        }
      </div>

      <!-- Verified Demo Banner -->
      <div class="demo-notice">
        <span class="badge badge-demo">DEMO DATA NOTICE</span>
        <span>
          Shelter locations, facilities, and contact details are simulated for academic demonstration in Mangaluru.
        </span>
      </div>

      <!-- Shelters Grid -->
      <div class="shelters-grid">
        @for (shelter of shelters; track shelter._id) {
          <div class="shelter-card">
            <div class="card-header">
              <h3 class="shelter-name">{{ shelter.name }}</h3>
              <span class="badge" [ngClass]="shelter.status === 'Open' ? 'badge-resolved' : 'badge-critical'">
                {{ shelter.status }}
              </span>
            </div>

            <div class="shelter-loc">📍 {{ shelter.address }}</div>

            <!-- Capacity Progress Bar -->
            <div class="occupancy-section">
              <div class="occupancy-labels">
                <span>Occupancy Rate</span>
                <span><strong>{{ shelter.occupancy }}</strong> / {{ shelter.capacity }}</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  [style.width.%]="(shelter.occupancy / shelter.capacity) * 100"
                  [class.full]="shelter.occupancy >= shelter.capacity"
                ></div>
              </div>
              <div class="available-badge">
                Available Spaces: <strong>{{ shelter.availableSpaces ?? (shelter.capacity - shelter.occupancy) }}</strong>
              </div>
            </div>

            <!-- Facilities -->
            <div class="facilities-box">
              <span class="facilities-title">Available Facilities:</span>
              <div class="facilities-pills">
                @for (f of shelter.facilities; track f) {
                  <span class="f-pill">✔ {{ f }}</span>
                }
              </div>
            </div>

            <!-- Contact & Map -->
            <div class="contact-box">
              <div>Person In Charge: <strong>{{ shelter.contactPerson }}</strong></div>
              <div>Phone: <a [href]="'tel:' + shelter.contactPhone" class="phone-link">{{ shelter.contactPhone }}</a></div>
            </div>

            @if (auth.isAdmin()) {
              <div class="admin-controls">
                <button class="btn btn-outline btn-xs" (click)="openEditModal(shelter)">✏️ Edit Shelter</button>
                <button class="btn btn-danger btn-xs" (click)="deleteShelter(shelter._id)">🗑️ Delete</button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Modal for Admin Add/Edit -->
      @if (showModal) {
        <div class="modal-backdrop">
          <div class="modal-box">
            <div class="modal-header">
              <h3>{{ editingShelterId ? 'Edit Relief Shelter' : 'Register New Relief Shelter' }}</h3>
              <button class="close-btn" (click)="showModal = false">✕</button>
            </div>
            <form (ngSubmit)="saveShelter()">
              <div class="form-group">
                <label class="form-label">Shelter Name</label>
                <input type="text" [(ngModel)]="shelterForm.name" name="name" class="form-control" required />
              </div>
              <div class="form-group">
                <label class="form-label">Address in Mangaluru</label>
                <input type="text" [(ngModel)]="shelterForm.address" name="address" class="form-control" required />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Capacity (Max Beds)</label>
                  <input type="number" [(ngModel)]="shelterForm.capacity" name="capacity" class="form-control" required min="1" />
                </div>
                <div class="form-group">
                  <label class="form-label">Current Occupancy</label>
                  <input type="number" [(ngModel)]="shelterForm.occupancy" name="occupancy" class="form-control" required min="0" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Latitude</label>
                  <input type="number" step="0.0001" [(ngModel)]="shelterForm.latitude" name="lat" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Longitude</label>
                  <input type="number" step="0.0001" [(ngModel)]="shelterForm.longitude" name="lng" class="form-control" required />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Contact Person</label>
                  <input type="text" [(ngModel)]="shelterForm.contactPerson" name="contactPerson" class="form-control" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Contact Phone</label>
                  <input type="text" [(ngModel)]="shelterForm.contactPhone" name="contactPhone" class="form-control" required />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select [(ngModel)]="shelterForm.status" name="status" class="form-control">
                  <option value="Open">Open</option>
                  <option value="Full">Full</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline" (click)="showModal = false">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Shelter</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .shelters-page {
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .page-header h2 {
      font-size: 1.4rem;
      color: var(--primary-color);
      font-weight: 700;
    }
    .page-header p {
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
    .shelters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.5rem;
    }
    .shelter-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .shelter-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    .shelter-loc {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
    }
    .occupancy-section {
      background: #f8fafc;
      padding: 0.85rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .occupancy-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #475569;
      margin-bottom: 0.35rem;
    }
    .progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }
    .progress-fill {
      height: 100%;
      background: var(--accent-teal);
    }
    .progress-fill.full {
      background: var(--danger-color);
    }
    .available-badge {
      font-size: 0.75rem;
      color: #0d9488;
      font-weight: 600;
    }
    .facilities-box {
      margin-bottom: 1rem;
      flex: 1;
    }
    .facilities-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      display: block;
      margin-bottom: 0.35rem;
    }
    .facilities-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .f-pill {
      font-size: 0.7rem;
      background: #f1f5f9;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      color: #334155;
    }
    .contact-box {
      border-top: 1px solid var(--border-color);
      padding-top: 0.75rem;
      font-size: 0.75rem;
      color: #475569;
      margin-bottom: 0.75rem;
    }
    .phone-link {
      color: var(--accent-blue);
      font-weight: 600;
    }
    .admin-controls {
      display: flex;
      gap: 0.5rem;
      border-top: 1px dashed var(--border-color);
      padding-top: 0.75rem;
    }
    .btn-xs {
      padding: 0.25rem 0.5rem;
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
      max-width: 520px;
      border-radius: 10px;
      padding: 1.5rem;
      max-height: 90vh;
      overflow-y: auto;
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
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `]
})
export class SheltersComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  shelters: Shelter[] = [];
  showModal = false;
  editingShelterId: string | null = null;

  shelterForm: Partial<Shelter> = {
    name: '',
    address: '',
    capacity: 200,
    occupancy: 0,
    latitude: 12.9141,
    longitude: 74.8560,
    contactPerson: '',
    contactPhone: '',
    status: 'Open',
    facilities: ['Clean Drinking Water', 'Community Kitchen', 'First Aid']
  };

  ngOnInit(): void {
    this.loadShelters();
  }

  loadShelters(): void {
    this.api.getShelters().subscribe({
      next: (res) => {
        if (res.success) {
          this.shelters = res.data;
          this.cdr.markForCheck();
        }
      }
    });
  }

  openAddModal(): void {
    this.editingShelterId = null;
    this.shelterForm = {
      name: '',
      address: 'Mangaluru, Karnataka',
      capacity: 200,
      occupancy: 0,
      latitude: 12.8700,
      longitude: 74.8500,
      contactPerson: '',
      contactPhone: '+91 824 2400000',
      status: 'Open',
      facilities: ['Clean Drinking Water', 'First Aid', 'Rest Area']
    };
    this.showModal = true;
  }

  openEditModal(sh: Shelter): void {
    this.editingShelterId = sh._id;
    this.shelterForm = { ...sh };
    this.showModal = true;
  }

  saveShelter(): void {
    if (this.editingShelterId) {
      this.api.updateShelter(this.editingShelterId, this.shelterForm).subscribe({
        next: () => {
          this.showModal = false;
          this.loadShelters();
        }
      });
    } else {
      this.api.createShelter(this.shelterForm).subscribe({
        next: () => {
          this.showModal = false;
          this.loadShelters();
        }
      });
    }
  }

  deleteShelter(id: string): void {
    if (confirm('Are you sure you want to delete this shelter record?')) {
      this.api.deleteShelter(id).subscribe({
        next: () => this.loadShelters()
      });
    }
  }
}
