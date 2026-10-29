import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { DashboardStats, Incident } from '../../models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-page">
      <!-- Admin Header -->
      <div class="admin-header">
        <div>
          <div class="badge badge-critical mb-1">COMMAND HEADQUARTERS</div>
          <h2>District Administrator Command Center</h2>
          <p>Mangaluru Disaster Management Authority — Live Incident Triaging & Resource Allocation</p>
        </div>
        <div class="header-actions">
          <a routerLink="/report-sos" class="btn btn-danger">🚨 Log Urgent Incident</a>
          <a routerLink="/map" class="btn btn-outline">🗺️ Strategic Map</a>
        </div>
      </div>

      <!-- Critical Statistics Cards Grid -->
      <div class="stat-cards-grid">
        <div class="stat-card border-red">
          <div class="card-icon">🚨</div>
          <div class="card-data">
            <span class="card-val text-red">{{ stats?.activeEmergencies || 0 }}</span>
            <span class="card-lbl">Active Emergencies</span>
          </div>
        </div>

        <div class="stat-card border-yellow">
          <div class="card-icon">⏳</div>
          <div class="card-data">
            <span class="card-val text-yellow">{{ stats?.awaitingAcknowledgment || 0 }}</span>
            <span class="card-lbl">Awaiting Acknowledgment</span>
          </div>
        </div>

        <div class="stat-card border-blue">
          <div class="card-icon">👷</div>
          <div class="card-data">
            <span class="card-val text-blue">{{ stats?.respondersCount || 0 }}</span>
            <span class="card-lbl">Responders Mobilized</span>
          </div>
        </div>

        <div class="stat-card border-teal">
          <div class="card-icon">⛺</div>
          <div class="card-data">
            <span class="card-val text-teal">{{ stats?.availableShelterSpaces || 0 }}</span>
            <span class="card-lbl">Available Shelter Spaces</span>
          </div>
        </div>

        <div class="stat-card border-green">
          <div class="card-icon">💰</div>
          <div class="card-data">
            <span class="card-val text-green">₹{{ (stats?.totalDonationAmount || 0) | number }}</span>
            <span class="card-lbl">Relief Capital Recorded</span>
          </div>
        </div>

        <div class="stat-card border-gray">
          <div class="card-icon">✅</div>
          <div class="card-data">
            <span class="card-val">{{ stats?.resolvedIncidents || 0 }}</span>
            <span class="card-lbl">Resolved Operations</span>
          </div>
        </div>
      </div>

      <!-- Analysis and Distributions Grid -->
      <div class="analysis-grid">
        <!-- Status Breakdown -->
        <div class="panel-card">
          <h3>Incident Status Distribution</h3>
          <div class="dist-list">
            @for (s of stats?.statusDistribution; track s._id) {
              <div class="dist-row">
                <span class="dist-label">{{ s._id }}</span>
                <div class="dist-bar-wrapper">
                  <div
                    class="dist-bar"
                    [style.width.%]="((s.count / (stats?.totalIncidents || 1)) * 100)"
                  ></div>
                </div>
                <span class="dist-count">{{ s.count }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="panel-card">
          <h3>Emergencies by Category</h3>
          <div class="dist-list">
            @for (c of stats?.categoryDistribution; track c._id) {
              <div class="dist-row">
                <span class="dist-label">{{ c._id }}</span>
                <div class="dist-bar-wrapper">
                  <div
                    class="dist-bar cat-bar"
                    [style.width.%]="((c.count / (stats?.totalIncidents || 1)) * 100)"
                  ></div>
                </div>
                <span class="dist-count">{{ c.count }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Live Incident Table for Admin -->
      <div class="panel-card table-panel">
        <div class="panel-header">
          <h3>Immediate Incident Response Queue</h3>
          <a routerLink="/my-reports" class="link-sm">View Full Database Ledger →</a>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Incident & Description</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Assigned Responder</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (inc of recentIncidents; track inc._id) {
              <tr>
                <td>
                  <span [ngClass]="'badge badge-' + getStatusClass(inc.status)">{{ inc.status }}</span>
                </td>
                <td>
                  <strong>{{ inc.title }}</strong>
                  <div class="desc-preview">{{ inc.description }}</div>
                </td>
                <td>{{ inc.category }}</td>
                <td>
                  <span [ngClass]="'badge badge-' + inc.severity.toLowerCase()">{{ inc.severity }}</span>
                </td>
                <td>
                  <span class="resp-pill">{{ inc.assignedResponderName || 'Needs Assignment' }}</span>
                </td>
                <td>📍 {{ inc.location.address }}</td>
                <td>
                  <a [routerLink]="['/incidents', inc._id]" class="btn btn-outline btn-xs">Manage Incident</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      max-width: 1250px;
      margin: 0 auto;
    }
    .admin-header {
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
    .admin-header h2 {
      font-size: 1.45rem;
      color: var(--primary-color);
      font-weight: 700;
    }
    .admin-header p {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
    .stat-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.15rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      box-shadow: var(--shadow-sm);
      border-left-width: 4px;
    }
    .border-red { border-left-color: #ef4444; }
    .border-yellow { border-left-color: #f59e0b; }
    .border-blue { border-left-color: #3b82f6; }
    .border-teal { border-left-color: #0d9488; }
    .border-green { border-left-color: #10b981; }
    .border-gray { border-left-color: #94a3b8; }

    .card-icon {
      font-size: 1.8rem;
    }
    .card-val {
      font-size: 1.4rem;
      font-weight: 800;
      line-height: 1.1;
      display: block;
    }
    .card-lbl {
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
      display: block;
    }
    .text-red { color: #ef4444; }
    .text-yellow { color: #d97706; }
    .text-blue { color: #2563eb; }
    .text-teal { color: #0d9488; }
    .text-green { color: #059669; }

    .analysis-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .panel-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .panel-card h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .dist-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .dist-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.8rem;
    }
    .dist-label {
      width: 130px;
      color: #334155;
      font-weight: 600;
    }
    .dist-bar-wrapper {
      flex: 1;
      height: 8px;
      background: #f1f5f9;
      border-radius: 4px;
      overflow: hidden;
    }
    .dist-bar {
      height: 100%;
      background: var(--accent-blue);
      border-radius: 4px;
    }
    .cat-bar {
      background: var(--accent-teal);
    }
    .dist-count {
      width: 30px;
      font-weight: 700;
      color: var(--primary-color);
      text-align: right;
    }

    .table-panel {
      overflow-x: auto;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .link-sm {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--accent-blue);
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
    .desc-preview {
      font-size: 0.75rem;
      color: var(--text-muted);
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .resp-pill {
      font-size: 0.75rem;
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
    @media (max-width: 900px) {
      .analysis-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  api = inject(ApiService);
  socket = inject(SocketService);
  private cdr = inject(ChangeDetectorRef);

  stats: DashboardStats | null = null;
  recentIncidents: Incident[] = [];

  ngOnInit(): void {
    this.loadAdminData();

    this.socket.onEvent('incident_created').subscribe(() => this.loadAdminData());
    this.socket.onEvent('incident_updated').subscribe(() => this.loadAdminData());
    this.socket.onEvent('shelter_updated').subscribe(() => this.loadAdminData());
    this.socket.onEvent('donation_updated').subscribe(() => this.loadAdminData());
  }

  loadAdminData(): void {
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
          this.recentIncidents = res.data.slice(0, 6);
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
