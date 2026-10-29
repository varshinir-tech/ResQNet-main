import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { Incident, Shelter, DashboardStats } from '../../models';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page">
      <!-- Welcome Header -->
      <div class="welcome-box">
        <div class="welcome-left">
          <h2>Welcome, {{ auth.currentUser()?.name }}</h2>
          <p>
            Role: <strong>{{ auth.currentUser()?.role | uppercase }}</strong> | Area: {{ auth.currentUser()?.areaOfOperation || 'Mangaluru City' }}
          </p>
        </div>
        <div class="welcome-right">
          <a routerLink="/report-sos" class="btn btn-danger">🚨 Report New Emergency / SOS</a>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">📢</div>
          <div class="metric-details">
            <span class="metric-val">{{ stats?.activeEmergencies || 0 }}</span>
            <span class="metric-lbl">Active District Emergencies</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">⛺</div>
          <div class="metric-details">
            <span class="metric-val">{{ stats?.availableShelterSpaces || 0 }}</span>
            <span class="metric-lbl">Available Shelter Spaces</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">🤝</div>
          <div class="metric-details">
            <span class="metric-val">{{ stats?.activeVolunteers || 0 }}</span>
            <span class="metric-lbl">Active Field Volunteers</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-icon">✅</div>
          <div class="metric-details">
            <span class="metric-val">{{ myIncidents.length }}</span>
            <span class="metric-lbl">My Submitted Reports</span>
          </div>
        </div>
      </div>

      <!-- Main Columns -->
      <div class="dashboard-content-grid">
        <!-- Left: Incident Workflow Status -->
        <div class="panel-card">
          <div class="panel-header">
            <h3>Recent Incidents in Mangaluru</h3>
            <a routerLink="/my-reports" class="link-sm">View All Incidents →</a>
          </div>

          @if (recentIncidents.length === 0) {
            <div class="empty-state">No incidents currently reported in your area.</div>
          } @else {
            <div class="incident-list">
              @for (item of recentIncidents; track item._id) {
                <div class="incident-row">
                  <div class="incident-info">
                    <div class="incident-title-row">
                      <span class="incident-title">{{ item.title }}</span>
                      <span [ngClass]="'badge badge-' + item.severity.toLowerCase()">{{ item.severity }}</span>
                    </div>
                    <div class="incident-meta">
                      <span>📍 {{ item.location.address }}</span>
                      <span>• Category: {{ item.category }}</span>
                      <span>• Time: {{ item.createdAt | date:'short' }}</span>
                    </div>
                  </div>
                  <div class="incident-action">
                    <span [ngClass]="'badge badge-' + getStatusClass(item.status)">{{ item.status }}</span>
                    <a [routerLink]="['/incidents', item._id]" class="btn btn-outline btn-xs">View Tracking</a>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Right: Operational Shelters -->
        <div class="panel-card">
          <div class="panel-header">
            <h3>Mangaluru Evacuation Shelters</h3>
            <a routerLink="/shelters" class="link-sm">All Shelters →</a>
          </div>

          @if (shelters.length === 0) {
            <div class="empty-state">Loading shelter status...</div>
          } @else {
            <div class="shelter-list">
              @for (shelter of shelters; track shelter._id) {
                <div class="shelter-item">
                  <div class="shelter-header-line">
                    <span class="shelter-name">{{ shelter.name }}</span>
                    <span class="badge" [ngClass]="shelter.status === 'Open' ? 'badge-resolved' : 'badge-critical'">
                      {{ shelter.status }}
                    </span>
                  </div>
                  <div class="shelter-address">📍 {{ shelter.address }}</div>
                  <div class="shelter-occupancy-bar">
                    <div
                      class="bar-fill"
                      [style.width.%]="(shelter.occupancy / shelter.capacity) * 100"
                      [class.bar-full]="shelter.occupancy >= shelter.capacity"
                    ></div>
                  </div>
                  <div class="shelter-capacity-labels">
                    <span>Occupancy: {{ shelter.occupancy }} / {{ shelter.capacity }}</span>
                    <span>Spaces Left: {{ shelter.availableSpaces ?? (shelter.capacity - shelter.occupancy) }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      max-width: 1200px;
      margin: 0 auto;
    }
    .welcome-box {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .welcome-left h2 {
      font-size: 1.4rem;
      color: var(--primary-color);
      font-weight: 700;
    }
    .welcome-left p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .metric-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
    }
    .metric-icon {
      font-size: 2rem;
      background: #f1f5f9;
      width: 50px;
      height: 50px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .metric-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--primary-color);
      display: block;
      line-height: 1.1;
    }
    .metric-lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
      display: block;
    }
    .dashboard-content-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 1.5rem;
    }
    .panel-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }
    .panel-header h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    .link-sm {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--accent-blue);
    }
    .empty-state {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .incident-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .incident-row {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }
    .incident-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }
    .incident-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    .incident-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .incident-action {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.35rem;
    }
    .btn-xs {
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
    }
    .shelter-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .shelter-item {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.85rem;
    }
    .shelter-header-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 0.25rem;
    }
    .shelter-address {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .shelter-occupancy-bar {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 0.35rem;
    }
    .bar-fill {
      height: 100%;
      background: var(--accent-teal);
      transition: width 0.3s;
    }
    .bar-full {
      background: var(--danger-color);
    }
    .shelter-capacity-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #64748b;
    }
    @media (max-width: 900px) {
      .dashboard-content-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CitizenDashboardComponent implements OnInit {
  auth = inject(AuthService);
  api = inject(ApiService);
  socket = inject(SocketService);
  private cdr = inject(ChangeDetectorRef);

  stats: DashboardStats | null = null;
  recentIncidents: Incident[] = [];
  myIncidents: Incident[] = [];
  shelters: Shelter[] = [];

  ngOnInit(): void {
    this.fetchData();

    // Listen for real-time incident broadcasts
    this.socket.onEvent('incident_created').subscribe(() => this.fetchData());
    this.socket.onEvent('incident_updated').subscribe(() => this.fetchData());
  }

  fetchData(): void {
    this.api.getDashboardStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.stats = res.data;
          this.cdr.markForCheck();
        }
      }
    });

    this.api.getIncidents().subscribe({
      next: (res) => {
        if (res.success) {
          this.recentIncidents = res.data.slice(0, 5);
          const userId = this.auth.currentUser()?.id || this.auth.currentUser()?._id;
          this.myIncidents = res.data.filter((i) => {
            const repId = typeof i.reportedBy === 'string' ? i.reportedBy : i.reportedBy?._id;
            return repId === userId;
          });
          this.cdr.markForCheck();
        }
      }
    });

    this.api.getShelters().subscribe({
      next: (res) => {
        if (res.success) {
          this.shelters = res.data.slice(0, 4);
          this.cdr.markForCheck();
        }
      }
    });
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
