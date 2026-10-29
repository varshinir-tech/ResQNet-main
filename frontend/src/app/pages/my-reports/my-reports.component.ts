import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Incident } from '../../models';

@Component({
  selector: 'app-my-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="reports-container">
      <div class="page-top">
        <div>
          <h2>📑 Emergency Incidents & Reports</h2>
          <p>Live status tracking across Mangaluru emergency reporting channels.</p>
        </div>
        <div class="actions">
          <a routerLink="/report-sos" class="btn btn-danger">🚨 Report New Emergency</a>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-card">
        <div class="filter-group">
          <label>Filter by Status</label>
          <select [(ngModel)]="statusFilter" (change)="loadIncidents()" class="form-control">
            <option value="">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Responder Assigned">Responder Assigned</option>
            <option value="Rescue in Progress">Rescue in Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Filter by Category</label>
          <select [(ngModel)]="categoryFilter" (change)="loadIncidents()" class="form-control">
            <option value="">All Categories</option>
            <option value="Flood">Flood</option>
            <option value="Landslide">Landslide</option>
            <option value="Fire">Fire</option>
            <option value="Heavy rainfall">Heavy rainfall</option>
            <option value="Medical emergency">Medical emergency</option>
            <option value="Accident">Accident</option>
            <option value="Other emergency">Other emergency</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Filter by Severity</label>
          <select [(ngModel)]="severityFilter" (change)="loadIncidents()" class="form-control">
            <option value="">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div class="filter-group toggle-group">
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="myOnly" (change)="loadIncidents()" />
            <span>Show My Reports Only</span>
          </label>
        </div>
      </div>

      <!-- Table / Cards List -->
      @if (isLoading) {
        <div class="loading-box">Fetching incident records from MongoDB...</div>
      } @else if (incidents.length === 0) {
        <div class="empty-box">
          <p>No emergency reports match the selected filters.</p>
          <button class="btn btn-outline btn-sm mt-2" (click)="resetFilters()">Clear Filters</button>
        </div>
      } @else {
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Headline & Category</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Assigned Responder</th>
                <th>Reported On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (item of incidents; track item._id) {
                <tr>
                  <td>
                    <span [ngClass]="'badge badge-' + getStatusClass(item.status)">{{ item.status }}</span>
                  </td>
                  <td>
                    <div class="table-title">{{ item.title }}</div>
                    <small class="table-sub">{{ item.category }}</small>
                  </td>
                  <td>
                    <div class="table-loc">📍 {{ item.location.address }}</div>
                  </td>
                  <td>
                    <span [ngClass]="'badge badge-' + item.severity.toLowerCase()">{{ item.severity }}</span>
                  </td>
                  <td>
                    @if (item.assignedResponderName || item.assignedResponder) {
                      <span class="responder-tag">👷 {{ item.assignedResponderName || 'Assigned Team' }}</span>
                    } @else {
                      <span class="text-muted">Unassigned</span>
                    }
                  </td>
                  <td>
                    <span class="date-tag">{{ item.createdAt | date:'short' }}</span>
                  </td>
                  <td>
                    <a [routerLink]="['/incidents', item._id]" class="btn btn-outline btn-xs">View Details →</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .reports-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
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
    .filter-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: flex-end;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .filter-group {
      flex: 1;
      min-width: 180px;
    }
    .filter-group label {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      color: #475569;
      margin-bottom: 0.35rem;
    }
    .toggle-group {
      display: flex;
      align-items: center;
      height: 38px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
    }
    .loading-box, .empty-box {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 3rem;
      text-align: center;
      color: var(--text-muted);
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
      text-align: left;
      font-size: 0.85rem;
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
    .table-title {
      font-weight: 600;
      color: var(--primary-color);
    }
    .table-sub {
      color: var(--text-muted);
      font-size: 0.75rem;
    }
    .table-loc {
      font-size: 0.8rem;
      color: #334155;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .responder-tag {
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.75rem;
    }
    .date-tag {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
  `]
})
export class MyReportsComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  incidents: Incident[] = [];
  isLoading = false;

  statusFilter = '';
  categoryFilter = '';
  severityFilter = '';
  myOnly = false;

  ngOnInit(): void {
    this.loadIncidents();
  }

  loadIncidents(): void {
    this.isLoading = true;
    this.api.getIncidents({
      status: this.statusFilter || undefined,
      category: this.categoryFilter || undefined,
      severity: this.severityFilter || undefined,
      myOnly: this.myOnly
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.incidents = res.data;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  resetFilters(): void {
    this.statusFilter = '';
    this.categoryFilter = '';
    this.severityFilter = '';
    this.myOnly = false;
    this.loadIncidents();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Reported': return 'reported';
      case 'Acknowledged': return 'acknowledged';
      case 'Responder Assigned': return 'assigned';
      case 'Rescue in Progress': return 'in-progress';
      case 'Resolved': return 'resolved';
      default: return 'medium';
    }
  }
}
