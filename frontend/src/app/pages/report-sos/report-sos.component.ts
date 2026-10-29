import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { OfflineService, QueuedIncident } from '../../services/offline.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-report-sos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="sos-container">
      <!-- SOS Header -->
      <div class="sos-header">
        <div class="header-titles">
          <h2>🚨 Submit Emergency SOS / Incident Report</h2>
          <p>Provide verified details to dispatch emergency rescue responders in Mangaluru.</p>
        </div>
        <div class="header-right-tags">
          @if (!offline.isOnline()) {
            <span class="offline-mode-pill">📡 OFFLINE REPORTING MODE</span>
          }
          <div class="sos-pulse-tag">IMMEDIATE DISPATCH QUEUE</div>
        </div>
      </div>

      <!-- Critical Offline Warning Alert -->
      @if (!offline.isOnline()) {
        <div class="alert alert-offline-warning">
          <div class="alert-title">⚠️ ATTENTION: YOU ARE CURRENTLY OFFLINE</div>
          <p>
            You do not have a working internet connection. If you submit this form, it will be 
            <strong>saved securely on your local device</strong> and queued.
          </p>
          <p class="highlight-warning">
            🛑 <strong>IMPORTANT:</strong> This emergency report has <u>NOT</u> yet reached the central server or emergency dispatch teams! It will synchronize automatically when connection returns, or you may dial local emergency services directly via phone.
          </p>
        </div>
      }

      @if (offlineNotice) {
        <div class="alert alert-offline-queued">
          <h4>📥 {{ offlineNotice }}</h4>
          <p>Reference Client ID: <code>{{ queuedClientRef }}</code></p>
          <p>Your report is safely stored in your browser's local queue and will transmit automatically once connection is re-established.</p>
          <div class="mt-2">
            <button class="btn btn-outline btn-sm" (click)="offlineNotice = ''">Dismiss Notice</button>
          </div>
        </div>
      }

      @if (successMessage) {
        <div class="alert alert-success">
          <h4>✅ {{ successMessage }}</h4>
          <p>Your report has been received and registered into the live MongoDB database. Incident ID: <code>{{ createdIncidentId }}</code></p>
          <div class="mt-2">
            <a [routerLink]="['/incidents', createdIncidentId]" class="btn btn-primary btn-sm">Track Incident Status Live →</a>
          </div>
        </div>
      }

      @if (errorMessage) {
        <div class="alert alert-error">⚠️ {{ errorMessage }}</div>
      }

      <!-- Offline Queued Items Manager Card -->
      @if (offline.queuedIncidents().length > 0) {
        <div class="card queued-manager-card">
          <div class="queue-card-header">
            <div>
              <h3>📋 Locally Queued Reports ({{ offline.queuedIncidents().length }})</h3>
              <small>Reports recorded while offline or awaiting server transmission</small>
            </div>
            <div class="queue-actions">
              <button class="btn btn-outline btn-xs" [disabled]="!offline.isOnline() || offline.isSyncing()" (click)="manualSync()">
                @if (offline.isSyncing()) {
                  <span>🔄 Syncing...</span>
                } @else {
                  <span>🔄 Sync Now</span>
                }
              </button>
              <button class="btn btn-outline btn-xs" (click)="offline.clearCompleted()">Clear Synced</button>
            </div>
          </div>

          <div class="queued-list">
            @for (item of offline.queuedIncidents(); track item.id) {
              <div class="queued-row" [ngClass]="'status-' + item.syncStatus">
                <div class="queued-details">
                  <div class="queued-title">
                    <strong>{{ item.title }}</strong>
                    <span class="badge" [ngClass]="item.syncStatus === 'synced' ? 'badge-resolved' : (item.syncStatus === 'syncing' ? 'badge-in-progress' : 'badge-critical')">
                      {{ item.syncStatus | uppercase }}
                    </span>
                  </div>
                  <div class="queued-meta">
                    <span>Category: {{ item.category }}</span> •
                    <span>Location: {{ item.address }}</span> •
                    <span>Recorded: {{ item.createdAt | date:'short' }}</span>
                  </div>
                  @if (item.lastError) {
                    <div class="queued-error">⚠️ Error: {{ item.lastError }}</div>
                  }
                  @if (item.serverIncidentId) {
                    <div class="queued-synced-ref">
                      ✅ Synced to Server ID: <a [routerLink]="['/incidents', item.serverIncidentId]"><code>{{ item.serverIncidentId }}</code></a>
                    </div>
                  }
                </div>
                <div class="queued-row-action">
                  <button class="delete-btn" (click)="deleteQueued(item.id)">✕</button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <div class="sos-grid">
        <!-- Form Column -->
        <div class="card form-card">
          <div class="form-header-bar">
            <h3>Incident Form</h3>
            <div class="draft-actions">
              <button type="button" class="btn btn-outline btn-xs" (click)="saveFormDraft()">💾 Save Draft</button>
              @if (hasDraft) {
                <button type="button" class="btn btn-outline btn-xs" (click)="restoreDraft()">Load Draft</button>
                <button type="button" class="btn btn-outline btn-xs" (click)="discardDraft()">Discard Draft</button>
              }
            </div>
          </div>

          <form (ngSubmit)="submitSOS()" #sosForm="ngForm">
            <div class="form-group">
              <label class="form-label" for="category">Emergency Category *</label>
              <select id="category" name="category" class="form-control" [(ngModel)]="category" required (change)="autoSaveDraft()">
                <option value="Flood">🌊 Flood / Waterlogging</option>
                <option value="Landslide">⛰️ Landslide / Ghat Collapse</option>
                <option value="Fire">🔥 Fire Outbreak</option>
                <option value="Heavy rainfall">⛈️ Heavy Rainfall / Tree Fall</option>
                <option value="Medical emergency">🚑 Critical Medical Emergency</option>
                <option value="Accident">💥 Accident / Structural Collapse</option>
                <option value="Other emergency">⚠️ Other Emergency</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="title">Incident Headline / Summary *</label>
              <input
                type="text"
                id="title"
                name="title"
                class="form-control"
                [(ngModel)]="title"
                required
                (input)="autoSaveDraft()"
                placeholder="e.g. Flash flood trapped 4 families near Jeppu"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="severity">Severity Level *</label>
              <div class="severity-options">
                <label class="severity-radio low">
                  <input type="radio" name="severity" [(ngModel)]="severity" value="Low" (change)="autoSaveDraft()" />
                  <span>Low</span>
                </label>
                <label class="severity-radio medium">
                  <input type="radio" name="severity" [(ngModel)]="severity" value="Medium" (change)="autoSaveDraft()" />
                  <span>Medium</span>
                </label>
                <label class="severity-radio high">
                  <input type="radio" name="severity" [(ngModel)]="severity" value="High" (change)="autoSaveDraft()" />
                  <span>High</span>
                </label>
                <label class="severity-radio critical">
                  <input type="radio" name="severity" [(ngModel)]="severity" value="Critical" (change)="autoSaveDraft()" />
                  <span>Critical (Life Threat)</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="description">Detailed Description & Needs *</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                class="form-control"
                [(ngModel)]="description"
                required
                (input)="autoSaveDraft()"
                placeholder="Specify number of stranded individuals, water level, elderly/children, special medical needs..."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label" for="address">Incident Address / Landmark in Mangaluru *</label>
              <input
                type="text"
                id="address"
                name="address"
                class="form-control"
                [(ngModel)]="address"
                required
                (input)="autoSaveDraft()"
                placeholder="e.g. Near Kadri Toll Gate, Mangaluru"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="phone">Contact Phone for Rescue Team *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                class="form-control"
                [(ngModel)]="contactPhone"
                required
                (input)="autoSaveDraft()"
                placeholder="+91 98765 43210"
              />
            </div>

            <button type="submit" class="btn btn-danger btn-block btn-lg" [disabled]="isSubmitting">
              @if (isSubmitting) {
                <span>Processing Emergency Report...</span>
              } @else if (!offline.isOnline()) {
                <span>💾 SAVE EMERGENCY REPORT OFFLINE</span>
              } @else {
                <span>🚨 DISPATCH EMERGENCY SOS REPORT</span>
              }
            </button>
          </form>
        </div>

        <!-- Location & Map Column -->
        <div class="card map-card">
          <div class="map-card-header">
            <h3>📍 Incident Geolocation Pinpoint</h3>
            <button type="button" class="btn btn-outline btn-xs" (click)="requestBrowserLocation()">
              🎯 Use My Device GPS
            </button>
          </div>

          @if (!offline.isOnline()) {
            <div class="offline-map-notice">
              ℹ️ <strong>Offline Note:</strong> OpenStreetMap tiles require internet unless previously cached. You can still manually input or adjust coordinates below using GPS or manual values.
            </div>
          }

          <p class="map-instructions">
            Click anywhere on the Mangaluru map below to place or adjust your exact emergency pin:
          </p>

          <div id="sosMap" class="sos-map-box"></div>

          <div class="coords-display">
            <span>Latitude: <strong>{{ latitude | number:'1.4-4' }}</strong></span>
            <span>Longitude: <strong>{{ longitude | number:'1.4-4' }}</strong></span>
          </div>

          <div class="location-warning">
            🔒 Location coordinates are stored securely on device and submitted to authorized Mangaluru disaster dispatchers.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sos-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .sos-header {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .header-titles h2 {
      font-size: 1.35rem;
      color: var(--danger-color);
      font-weight: 700;
    }
    .header-titles p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }
    .header-right-tags {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .offline-mode-pill {
      background: #ef4444;
      color: white;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
    }
    .sos-pulse-tag {
      background: #fee2e2;
      color: #991b1b;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      border: 1px solid #fecaca;
      animation: pulse 1.5s infinite;
    }
    .alert {
      padding: 1rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }
    .alert-offline-warning {
      background-color: #fff1f2;
      border: 2px solid #f43f5e;
      color: #881337;
    }
    .alert-title {
      font-weight: 800;
      font-size: 0.95rem;
      margin-bottom: 0.35rem;
    }
    .highlight-warning {
      margin-top: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #ffe4e6;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    .alert-offline-queued {
      background-color: #fefce8;
      border: 1px solid #fef08a;
      color: #854d0e;
    }
    .alert-success {
      background-color: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }
    .alert-error {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .queued-manager-card {
      margin-bottom: 1.5rem;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.25rem;
    }
    .queue-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .queue-card-header h3 {
      font-size: 1rem;
      color: var(--primary-color);
      margin: 0;
    }
    .queue-card-header small {
      color: var(--text-muted);
    }
    .queue-actions {
      display: flex;
      gap: 0.5rem;
    }
    .queued-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .queued-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      background: #f8fafc;
    }
    .queued-row.status-synced {
      background: #ecfdf5;
      border-color: #a7f3d0;
    }
    .queued-row.status-failed {
      background: #fff1f2;
      border-color: #fecdd3;
    }
    .queued-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: var(--primary-color);
    }
    .queued-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.2rem;
    }
    .queued-error {
      font-size: 0.75rem;
      color: #e11d48;
      margin-top: 0.2rem;
    }
    .queued-synced-ref {
      font-size: 0.75rem;
      color: #059669;
      margin-top: 0.2rem;
    }
    .delete-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 1rem;
    }
    .delete-btn:hover {
      color: #ef4444;
    }
    .sos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .form-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .form-header-bar h3 {
      font-size: 1.05rem;
      color: var(--primary-color);
      margin: 0;
    }
    .draft-actions {
      display: flex;
      gap: 0.35rem;
    }
    .severity-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
    .severity-radio {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .severity-radio.low { background: #f0f9ff; }
    .severity-radio.medium { background: #fefce8; }
    .severity-radio.high { background: #fff7ed; }
    .severity-radio.critical { background: #fef2f2; color: #991b1b; }

    .btn-block {
      width: 100%;
      margin-top: 1rem;
    }
    .btn-lg {
      padding: 0.85rem;
      font-size: 0.95rem;
      font-weight: 700;
    }
    .map-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .map-card-header h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    .offline-map-notice {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      color: #475569;
      margin-bottom: 0.75rem;
    }
    .map-instructions {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }
    .sos-map-box {
      height: 380px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      margin-bottom: 0.75rem;
      background-color: #e2e8f0;
    }
    .coords-display {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      background: #f1f5f9;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      margin-bottom: 0.75rem;
    }
    .location-warning {
      font-size: 0.75rem;
      color: #64748b;
    }
    @media (max-width: 900px) {
      .sos-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ReportSosComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  offline = inject(OfflineService);
  router = inject(Router);

  title = '';
  category = 'Flood';
  severity = 'High';
  description = '';
  address = 'Jeppu, Mangaluru, Karnataka';
  contactPhone = '';
  latitude = 12.8510;
  longitude = 74.8580;

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  offlineNotice = '';
  queuedClientRef = '';
  createdIncidentId = '';
  hasDraft = false;

  private map!: L.Map;
  private marker!: L.Marker;

  ngOnInit(): void {
    if (this.auth.currentUser()) {
      this.contactPhone = this.auth.currentUser()?.phone || '';
      if (this.auth.currentUser()?.address) {
        this.address = this.auth.currentUser()!.address!;
      }
    }

    // Check for saved draft
    const saved = this.offline.loadDraft();
    if (saved) {
      this.hasDraft = true;
    }

    setTimeout(() => this.initMap(), 200);
  }

  private initMap(): void {
    const defaultCoords: L.LatLngExpression = [this.latitude, this.longitude];

    try {
      this.map = L.map('sosMap', {
        center: defaultCoords,
        zoom: 13
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(this.map);

      this.marker = L.marker(defaultCoords, { draggable: true }).addTo(this.map);
      this.marker.bindPopup('<b>Selected Emergency Spot</b><br>Drag to adjust coordinates.').openPopup();

      this.marker.on('dragend', () => {
        const pos = this.marker.getLatLng();
        this.latitude = pos.lat;
        this.longitude = pos.lng;
        this.autoSaveDraft();
      });

      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.latitude = e.latlng.lat;
        this.longitude = e.latlng.lng;
        this.marker.setLatLng(e.latlng);
        this.autoSaveDraft();
      });
    } catch (e) {
      console.warn('Map initialization in offline mode:', e);
    }
  }

  requestBrowserLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.latitude = pos.coords.latitude;
          this.longitude = pos.coords.longitude;
          if (this.map && this.marker) {
            const newPos: L.LatLngExpression = [this.latitude, this.longitude];
            this.map.setView(newPos, 15);
            this.marker.setLatLng(newPos);
            this.marker.bindPopup('📍 Your GPS Location').openPopup();
          }
          this.autoSaveDraft();
        },
        () => {
          alert('GPS permission was denied or unavailable. Coordinates kept at Mangaluru defaults.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }

  autoSaveDraft(): void {
    if (this.title || this.description) {
      this.offline.saveDraft({
        title: this.title,
        description: this.description,
        category: this.category,
        severity: this.severity,
        address: this.address,
        latitude: this.latitude,
        longitude: this.longitude,
        contactPhone: this.contactPhone,
        updatedAt: new Date().toISOString()
      });
      this.hasDraft = true;
    }
  }

  saveFormDraft(): void {
    this.autoSaveDraft();
    alert('Draft saved locally on this device.');
  }

  restoreDraft(): void {
    const draft = this.offline.loadDraft();
    if (draft) {
      this.title = draft.title || '';
      this.description = draft.description || '';
      this.category = draft.category || 'Flood';
      this.severity = draft.severity || 'High';
      this.address = draft.address || 'Jeppu, Mangaluru, Karnataka';
      this.contactPhone = draft.contactPhone || '';
      this.latitude = draft.latitude || 12.8510;
      this.longitude = draft.longitude || 74.8580;

      if (this.map && this.marker) {
        const coords: L.LatLngExpression = [this.latitude, this.longitude];
        this.map.setView(coords, 14);
        this.marker.setLatLng(coords);
      }
      alert('Draft restored successfully.');
    }
  }

  discardDraft(): void {
    this.offline.clearDraft();
    this.hasDraft = false;
  }

  deleteQueued(id: string): void {
    this.offline.removeQueuedIncident(id);
  }

  manualSync(): void {
    this.offline.syncQueuedIncidents().then(({ successCount, failCount }) => {
      if (successCount > 0) {
        alert(`Successfully synced ${successCount} emergency report(s) to the central database.`);
      } else if (failCount > 0) {
        alert(`Sync failed for ${failCount} report(s). Please verify backend server is online.`);
      }
    });
  }

  submitSOS(): void {
    if (!this.title || !this.description || !this.contactPhone) {
      this.errorMessage = 'Please complete all required fields.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.offlineNotice = '';

    const payload = {
      title: this.title,
      description: this.description,
      category: this.category,
      severity: this.severity,
      address: this.address,
      latitude: this.latitude,
      longitude: this.longitude,
      contactPhone: this.contactPhone
    };

    // If device is offline, enqueue locally
    if (!this.offline.isOnline()) {
      const enqueued = this.offline.enqueueIncident(payload);
      this.queuedClientRef = enqueued.id;
      this.offlineNotice = 'Emergency report stored locally in offline queue.';
      this.title = '';
      this.description = '';
      this.hasDraft = false;
      return;
    }

    // When online, attempt server post
    this.isSubmitting = true;
    this.api.createIncident(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.successMessage = res.message;
          this.createdIncidentId = res.data._id;
          this.title = '';
          this.description = '';
          this.offline.clearDraft();
          this.hasDraft = false;
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        // If network failed during online attempt, offer fallback to offline queue
        if (err.status === 0 || err.status === 503 || !navigator.onLine) {
          const enqueued = this.offline.enqueueIncident(payload);
          this.queuedClientRef = enqueued.id;
          this.offlineNotice = 'Network connection failed during dispatch. Report has been saved to your local offline queue for automatic synchronization.';
          this.title = '';
          this.description = '';
          this.hasDraft = false;
        } else {
          this.errorMessage = err.error?.message || 'Failed to submit incident. Please check server connection.';
        }
      }
    });
  }
}
