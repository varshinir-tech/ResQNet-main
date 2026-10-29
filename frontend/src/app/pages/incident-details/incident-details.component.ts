import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Incident, User } from '../../models';
import * as L from 'leaflet';

@Component({
  selector: 'app-incident-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="incident-details-container" *ngIf="incident">
      <!-- Top Bar -->
      <div class="details-header">
        <div class="header-left">
          <a routerLink="/my-reports" class="back-link">← Back to Incident List</a>
          <h2>{{ incident.title }}</h2>
          <div class="tags-row">
            <span [ngClass]="'badge badge-' + getStatusClass(incident.status)">{{ incident.status }}</span>
            <span [ngClass]="'badge badge-' + incident.severity.toLowerCase()">Severity: {{ incident.severity }}</span>
            <span class="badge badge-demo">Category: {{ incident.category }}</span>
            @if (incident.isDemoData) {
              <span class="badge badge-demo">Demo Record</span>
            }
          </div>
        </div>

        <div class="header-right">
          <div class="incident-id-box">
            <span>Incident Reference:</span>
            <code>{{ incident._id }}</code>
          </div>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="details-grid">
        <!-- Left: Incident Details & Status Workflow Timeline -->
        <div class="left-col">
          <!-- Description Card -->
          <div class="card">
            <h3>Incident Information</h3>
            <p class="description-text">{{ incident.description }}</p>

            <div class="info-rows">
              <div class="info-item">
                <span class="lbl">Reported By:</span>
                <span class="val">{{ incident.reporterName || 'Citizen' }}</span>
              </div>
              <div class="info-item">
                <span class="lbl">Contact Helpline:</span>
                <span class="val font-mono">{{ incident.contactPhone }}</span>
              </div>
              <div class="info-item">
                <span class="lbl">Location Address:</span>
                <span class="val">{{ incident.location.address }}</span>
              </div>
              <div class="info-item">
                <span class="lbl">GPS Coordinates:</span>
                <span class="val font-mono">{{ incident.location.latitude }}, {{ incident.location.longitude }}</span>
              </div>
              <div class="info-item">
                <span class="lbl">Assigned Responder:</span>
                <span class="val font-semibold">{{ incident.assignedResponderName || 'Pending Assignment' }}</span>
              </div>
            </div>
          </div>

          <!-- Status History Timeline -->
          <div class="card timeline-card">
            <h3>Incident Progress Workflow Timeline</h3>
            <div class="workflow-steps">
              <div class="step-line" [class.step-active]="isStepReached('Reported')">
                <div class="circle">1</div>
                <span>Reported</span>
              </div>
              <div class="step-line" [class.step-active]="isStepReached('Acknowledged')">
                <div class="circle">2</div>
                <span>Acknowledged</span>
              </div>
              <div class="step-line" [class.step-active]="isStepReached('Responder Assigned')">
                <div class="circle">3</div>
                <span>Assigned</span>
              </div>
              <div class="step-line" [class.step-active]="isStepReached('Rescue in Progress')">
                <div class="circle">4</div>
                <span>In Progress</span>
              </div>
              <div class="step-line" [class.step-active]="isStepReached('Resolved')">
                <div class="circle">5</div>
                <span>Resolved</span>
              </div>
            </div>

            <!-- Detailed History Logs -->
            <div class="timeline-logs">
              <h4>Activity & Audit Trail</h4>
              @for (h of incident.statusHistory; track $index) {
                <div class="log-entry">
                  <div class="log-dot"></div>
                  <div class="log-body">
                    <div class="log-header">
                      <strong>{{ h.status }}</strong>
                      <span class="log-time">{{ h.timestamp | date:'medium' }}</span>
                    </div>
                    <div class="log-sub">Action by: {{ h.changedByName }}</div>
                    @if (h.comment) {
                      <div class="log-comment">"{{ h.comment }}"</div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Admin & Responder Action Controls -->
          @if (canUpdateStatus()) {
            <div class="card update-card">
              <h3>Update Incident Progress (Authorized Access)</h3>
              <div class="update-form">
                <div class="form-group">
                  <label class="form-label">Change Status To:</label>
                  <select [(ngModel)]="newStatus" class="form-control">
                    <option value="Reported">Reported</option>
                    <option value="Acknowledged">Acknowledged</option>
                    <option value="Responder Assigned">Responder Assigned</option>
                    <option value="Rescue in Progress">Rescue in Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                @if (auth.isAdmin()) {
                  <div class="form-group">
                    <label class="form-label">Assign / Reassign Responder:</label>
                    <select [(ngModel)]="selectedResponderId" class="form-control">
                      <option value="">Keep current responder</option>
                      @for (resp of respondersList; track resp._id) {
                        <option [value]="resp._id">{{ resp.name }} ({{ resp.skills?.join(', ') }})</option>
                      }
                    </select>
                  </div>
                }

                <div class="form-group">
                  <label class="form-label">Operational Log Comment:</label>
                  <input
                    type="text"
                    [(ngModel)]="statusComment"
                    class="form-control"
                    placeholder="e.g. NDRF Unit 3 dispatched with 2 rubber boats."
                  />
                </div>

                <button class="btn btn-primary" (click)="saveStatusUpdate()" [disabled]="isUpdating">
                  @if (isUpdating) {
                    <span>Saving to MongoDB...</span>
                  } @else {
                    <span>Apply Workflow Update</span>
                  }
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Right: Map Preview & Directions -->
        <div class="right-col">
          <div class="card map-preview-card">
            <h3>Incident Location Map</h3>
            <div id="incidentMap" class="incident-map-box"></div>
            <div class="map-actions">
              <a
                [href]="'https://www.google.com/maps/search/?api=1&query=' + incident.location.latitude + ',' + incident.location.longitude"
                target="_blank"
                rel="noopener"
                class="btn btn-outline btn-block"
              >
                🗺️ Open in Google Maps / Directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .incident-details-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .details-header {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .back-link {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--accent-blue);
      display: inline-block;
      margin-bottom: 0.5rem;
    }
    .header-left h2 {
      font-size: 1.4rem;
      color: var(--primary-color);
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .incident-id-box {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-align: right;
    }
    .incident-id-box code {
      display: block;
      background: #f1f5f9;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      margin-top: 0.2rem;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1.3fr 0.7fr;
      gap: 1.5rem;
    }
    .card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .description-text {
      font-size: 0.95rem;
      color: #334155;
      line-height: 1.6;
      margin-bottom: 1.25rem;
    }
    .info-rows {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      font-size: 0.85rem;
    }
    .info-item {
      display: flex;
      flex-direction: column;
    }
    .info-item .lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .info-item .val {
      color: var(--text-main);
      font-weight: 500;
    }
    .font-mono { font-family: monospace; }
    .font-semibold { font-weight: 600; color: var(--accent-teal); }

    /* Workflow visual timeline */
    .workflow-steps {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1.75rem;
      position: relative;
    }
    .step-line {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      flex: 1;
      text-align: center;
    }
    .step-line .circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
    }
    .step-line.step-active {
      color: var(--primary-color);
    }
    .step-line.step-active .circle {
      background: var(--accent-teal);
      color: white;
    }

    /* Logs */
    .timeline-logs h4 {
      font-size: 0.9rem;
      color: var(--primary-color);
      margin-bottom: 0.85rem;
    }
    .log-entry {
      display: flex;
      gap: 0.85rem;
      padding-bottom: 1rem;
      border-left: 2px solid #e2e8f0;
      margin-left: 0.5rem;
      padding-left: 1rem;
      position: relative;
    }
    .log-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--accent-teal);
      position: absolute;
      left: -6px;
      top: 4px;
    }
    .log-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--primary-color);
    }
    .log-time {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .log-sub {
      font-size: 0.75rem;
      color: #64748b;
    }
    .log-comment {
      font-size: 0.8rem;
      font-style: italic;
      color: #334155;
      margin-top: 0.25rem;
      background: #f8fafc;
      padding: 0.35rem 0.5rem;
      border-radius: 4px;
    }

    .update-card {
      background: #f0fdfa;
      border-color: #ccfbf1;
    }
    .update-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .incident-map-box {
      height: 320px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      margin-bottom: 1rem;
    }
    .btn-block {
      width: 100%;
    }
    @media (max-width: 900px) {
      .details-grid {
        grid-template-columns: 1fr;
      }
      .info-rows {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class IncidentDetailsComponent implements OnInit {
  route = inject(ActivatedRoute);
  api = inject(ApiService);
  auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  incident: Incident | null = null;
  respondersList: User[] = [];
  newStatus = '';
  statusComment = '';
  selectedResponderId = '';
  isUpdating = false;

  private map!: L.Map;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadIncident(id);
      if (this.auth.isAdmin()) {
        this.api.getResponders().subscribe({
          next: (res) => {
            if (res.success) {
              this.respondersList = res.data;
              this.cdr.markForCheck();
            }
          }
        });
      }
    }
  }

  loadIncident(id: string): void {
    this.api.getIncidentById(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.incident = res.data;
          this.newStatus = this.incident.status;
          this.cdr.markForCheck();
          setTimeout(() => this.initMap(), 150);
        }
      }
    });
  }

  private initMap(): void {
    if (!this.incident) return;
    const coords: L.LatLngExpression = [
      this.incident.location.latitude,
      this.incident.location.longitude
    ];

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('incidentMap', { center: coords, zoom: 14 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    L.marker(coords).addTo(this.map)
      .bindPopup(`<b>${this.incident.title}</b><br>${this.incident.location.address}`)
      .openPopup();
  }

  canUpdateStatus(): boolean {
    if (this.auth.isAdmin()) return true;
    if (this.auth.isResponder()) {
      const myId = this.auth.currentUser()?.id || this.auth.currentUser()?._id;
      const respId = typeof this.incident?.assignedResponder === 'string'
        ? this.incident.assignedResponder
        : this.incident?.assignedResponder?._id;
      return respId === myId;
    }
    return false;
  }

  isStepReached(stepName: string): boolean {
    const order = ['Reported', 'Acknowledged', 'Responder Assigned', 'Rescue in Progress', 'Resolved'];
    const curIdx = order.indexOf(this.incident?.status || '');
    const stepIdx = order.indexOf(stepName);
    return curIdx >= stepIdx;
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

  saveStatusUpdate(): void {
    if (!this.incident) return;
    this.isUpdating = true;

    this.api.updateIncidentStatus(this.incident._id, {
      status: this.newStatus,
      comment: this.statusComment,
      assignedResponderId: this.selectedResponderId || undefined
    }).subscribe({
      next: (res) => {
        this.isUpdating = false;
        if (res.success) {
          this.incident = res.data;
          this.statusComment = '';
          alert('Incident status updated and real-time notification broadcasted.');
        }
      },
      error: (err) => {
        this.isUpdating = false;
        alert(err.error?.message || 'Failed to update incident status.');
      }
    });
  }
}
