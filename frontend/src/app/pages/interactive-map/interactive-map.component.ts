import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Incident, Shelter } from '../../models';
import * as L from 'leaflet';

@Component({
  selector: 'app-interactive-map',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="map-page-container">
      <div class="map-topbar">
        <div>
          <h2>🗺️ Mangaluru Interactive Disaster & Shelter Map</h2>
          <p>Real-time spatial visualization of emergency incidents, relief shelters, and safe zones.</p>
        </div>
        <div class="map-legend">
          <span class="legend-item"><span class="dot dot-incident"></span> Incidents</span>
          <span class="legend-item"><span class="dot dot-shelter"></span> Evacuation Shelters</span>
        </div>
      </div>

      <div class="map-wrapper">
        <div id="mainCrisisMap" class="leaflet-full-map"></div>

        <!-- Sidebar overlay list -->
        <div class="map-side-panel">
          <h3>Active Map Points ({{ incidents.length + shelters.length }})</h3>

          <div class="panel-section">
            <h4>🚨 Emergency Incidents ({{ incidents.length }})</h4>
            <div class="point-list">
              @for (inc of incidents; track inc._id) {
                <div class="point-item" (click)="flyToCoords(inc.location.latitude, inc.location.longitude)">
                  <div class="point-title">{{ inc.title }}</div>
                  <div class="point-meta">
                    <span [ngClass]="'badge badge-' + inc.severity.toLowerCase()">{{ inc.severity }}</span>
                    <span>{{ inc.category }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="panel-section">
            <h4>⛺ Evacuation Shelters ({{ shelters.length }})</h4>
            <div class="point-list">
              @for (sh of shelters; track sh._id) {
                <div class="point-item" (click)="flyToCoords(sh.latitude, sh.longitude)">
                  <div class="point-title">{{ sh.name }}</div>
                  <div class="point-meta">
                    <span class="badge" [ngClass]="sh.status === 'Open' ? 'badge-resolved' : 'badge-critical'">
                      {{ sh.status }}
                    </span>
                    <span>Spaces: {{ sh.availableSpaces ?? (sh.capacity - sh.occupancy) }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-page-container {
      max-width: 1300px;
      margin: 0 auto;
    }
    .map-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .map-topbar h2 {
      font-size: 1.4rem;
      color: var(--primary-color);
      font-weight: 700;
    }
    .map-topbar p {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .map-legend {
      display: flex;
      gap: 1rem;
      background: #ffffff;
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      font-size: 0.8rem;
      font-weight: 600;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .dot-incident { background: #ef4444; }
    .dot-shelter { background: #0d9488; }

    .map-wrapper {
      display: grid;
      grid-template-columns: 1fr 340px;
      height: 640px;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .leaflet-full-map {
      width: 100%;
      height: 100%;
    }
    .map-side-panel {
      border-left: 1px solid var(--border-color);
      padding: 1rem;
      overflow-y: auto;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .map-side-panel h3 {
      font-size: 1rem;
      color: var(--primary-color);
      font-weight: 700;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }
    .panel-section h4 {
      font-size: 0.8rem;
      color: #475569;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .point-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .point-item {
      background: #ffffff;
      border: 1px solid var(--border-color);
      padding: 0.65rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .point-item:hover {
      border-color: var(--accent-blue);
      transform: translateX(3px);
    }
    .point-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--primary-color);
      margin-bottom: 0.25rem;
    }
    .point-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    @media (max-width: 900px) {
      .map-wrapper {
        grid-template-columns: 1fr;
        height: auto;
      }
      .leaflet-full-map {
        height: 420px;
      }
    }
  `]
})
export class InteractiveMapComponent implements OnInit {
  api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  incidents: Incident[] = [];
  shelters: Shelter[] = [];

  private map!: L.Map;

  ngOnInit(): void {
    setTimeout(() => this.initMap(), 200);
  }

  private initMap(): void {
    // Center of Mangaluru City
    this.map = L.map('mainCrisisMap', {
      center: [12.9141, 74.8560],
      zoom: 12
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.loadDataAndRenderMarkers();
  }

  private loadDataAndRenderMarkers(): void {
    this.api.getIncidents().subscribe({
      next: (res) => {
        if (res.success) {
          this.incidents = res.data;
          this.renderIncidentMarkers();
          this.cdr.markForCheck();
        }
      }
    });

    this.api.getShelters().subscribe({
      next: (res) => {
        if (res.success) {
          this.shelters = res.data;
          this.renderShelterMarkers();
          this.cdr.markForCheck();
        }
      }
    });
  }

  private renderIncidentMarkers(): void {
    this.incidents.forEach((inc) => {
      const circle = L.circleMarker([inc.location.latitude, inc.location.longitude], {
        radius: 9,
        fillColor: inc.severity === 'Critical' ? '#ef4444' : '#f97316',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
      }).addTo(this.map);

      circle.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px;">
          <h4 style="margin: 0 0 4px 0; color: #0f2942; font-size: 13px;">${inc.title}</h4>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">📍 ${inc.location.address}</p>
          <div style="font-size: 11px; margin-bottom: 6px;">
            <strong>Category:</strong> ${inc.category}<br/>
            <strong>Status:</strong> ${inc.status}
          </div>
          <a href="/incidents/${inc._id}" style="color: #0284c7; font-weight: 600; font-size: 11px;">View Incident Details →</a>
        </div>
      `);
    });
  }

  private renderShelterMarkers(): void {
    this.shelters.forEach((sh) => {
      const circle = L.circleMarker([sh.latitude, sh.longitude], {
        radius: 9,
        fillColor: '#0d9488',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
      }).addTo(this.map);

      circle.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px;">
          <h4 style="margin: 0 0 4px 0; color: #0f2942; font-size: 13px;">⛺ ${sh.name}</h4>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #64748b;">📍 ${sh.address}</p>
          <div style="font-size: 11px; margin-bottom: 6px;">
            <strong>Status:</strong> ${sh.status}<br/>
            <strong>Capacity:</strong> ${sh.occupancy} / ${sh.capacity}<br/>
            <strong>Phone:</strong> ${sh.contactPhone}
          </div>
        </div>
      `);
    });
  }

  flyToCoords(lat: number, lng: number): void {
    if (this.map) {
      this.map.flyTo([lat, lng], 15, { duration: 1.2 });
    }
  }
}
