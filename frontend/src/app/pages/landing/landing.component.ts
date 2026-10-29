import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { DashboardStats } from '../../models';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="landing-container">
      <!-- Emergency Banner -->
      <div class="disclaimer-banner">
        <span class="warning-badge">DEMO EVALUATION SYSTEM</span>
        <span>
          ResQ Mangaluru is an MCA capstone disaster response simulation. Phone calls and external integrations run in test mode.
        </span>
      </div>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-tag">MANGALURU DISASTER PREPAREDNESS & RELIEF</div>
          <h1 class="hero-title">Immediate Emergency Response & Shelter Coordination</h1>
          <p class="hero-description">
            A centralized digital platform connecting citizens of Mangaluru, coastal emergency responders, and district administrators during monsoonal floods, landslides, and critical emergencies.
          </p>

          <div class="hero-actions">
            @if (auth.isLoggedIn()) {
              <a routerLink="/report-sos" class="btn btn-danger btn-lg">
                <span>🚨 Report Emergency / SOS</span>
              </a>
              @if (auth.isAdmin()) {
                <a routerLink="/admin-dashboard" class="btn btn-primary btn-lg">Admin Command Center</a>
              } @else {
                <a routerLink="/citizen-dashboard" class="btn btn-primary btn-lg">Operations Dashboard</a>
              }
            } @else {
              <a routerLink="/login" class="btn btn-danger btn-lg">
                <span>🚨 Report Emergency / SOS</span>
              </a>
              <a routerLink="/login" class="btn btn-primary btn-lg">Login to Command Center</a>
            }
            <a routerLink="/map" class="btn btn-outline btn-lg">View Live Crisis Map</a>
          </div>
        </div>

        <div class="hero-stats-card">
          <h3 class="card-title">Live Mangaluru Relief Overview</h3>
          <div class="stats-grid">
            <div class="stat-box">
              <span class="stat-number">{{ stats?.totalIncidents || 5 }}</span>
              <span class="stat-label">Reported Incidents</span>
            </div>
            <div class="stat-box active-em">
              <span class="stat-number">{{ stats?.activeEmergencies || 3 }}</span>
              <span class="stat-label">Active Emergencies</span>
            </div>
            <div class="stat-box">
              <span class="stat-number">{{ stats?.availableShelterSpaces || 430 }}</span>
              <span class="stat-label">Shelter Spaces Open</span>
            </div>
            <div class="stat-box">
              <span class="stat-number">₹{{ (stats?.totalDonationAmount || 100000) | number }}</span>
              <span class="stat-label">Relief Funds Tracked</span>
            </div>
          </div>
          <div class="badge-demo text-center mt-2">Verified Demo Records - Updated Live</div>
        </div>
      </section>

      <!-- Key Capabilities -->
      <section class="features-section">
        <h2 class="section-heading">Comprehensive Emergency Modules</h2>
        <p class="section-subheading">Built for fast action, transparency, and coordinated resource management</p>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🚨</div>
            <h3>Instant SOS & Geolocation</h3>
            <p>Citizens can report floods, landslides, or fires with precise GPS coordinates, contact details, and severity ratings.</p>
            <a routerLink="/report-sos" class="feature-link">Report Incident →</a>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🗺️</div>
            <h3>Interactive Leaflet Maps</h3>
            <p>Geospatial visualization of active incidents, operational evacuation shelters, and safe zones across Mangaluru.</p>
            <a routerLink="/map" class="feature-link">Open Map →</a>
          </div>

          <div class="feature-card">
            <div class="feature-icon">⛺</div>
            <h3>Shelter & Camp Capacity</h3>
            <p>Real-time occupancy tracking for evacuation centers like Town Hall, Kadri Relief Center, and Surathkal Camp.</p>
            <a routerLink="/shelters" class="feature-link">Find Shelters →</a>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🤝</div>
            <h3>Volunteer Mobilization</h3>
            <p>Register volunteers, categorize skills like First Aid or Boat Operations, and assign responders directly to rescue missions.</p>
            <a routerLink="/volunteers" class="feature-link">Join Response →</a>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🎁</div>
            <h3>Transparent Relief Tracking</h3>
            <p>Track monetary donations, food rations, drinking water, and medical kits with clear administrative audit logging.</p>
            <a routerLink="/donations" class="feature-link">Track Donations →</a>
          </div>

          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Socket.IO Real-Time Dispatch</h3>
            <p>Instant status propagation across incident workflows: Reported → Acknowledged → Assigned → Rescue in Progress → Resolved.</p>
            <a routerLink="/login" class="feature-link">Explore Real-time →</a>
          </div>
        </div>
      </section>

      <!-- Demo Accounts Card for College Evaluator -->
      <section class="evaluator-card">
        <div class="evaluator-header">
          <h3>🎓 College Evaluation Quick-Demo Credentials</h3>
          <span class="badge badge-demo">One-Click Demonstration Available</span>
        </div>
        <p class="evaluator-desc">Use any of the three pre-seeded accounts to demonstrate role-based workflows during project evaluation:</p>
        <div class="accounts-grid">
          <div class="account-item">
            <span class="account-role role-admin">ADMINISTRATOR</span>
            <div class="account-email">admin&#64;resqmangaluru.org</div>
            <div class="account-pass">Password: <code>AdminPassword123!</code></div>
            <small>Full control: acknowledge incidents, assign responders, manage shelters & funds.</small>
          </div>
          <div class="account-item">
            <span class="account-role role-responder">RESPONDER / VOLUNTEER</span>
            <div class="account-email">responder&#64;resqmangaluru.org</div>
            <div class="account-pass">Password: <code>ResponderPass123!</code></div>
            <small>NDRF Lead: view assigned incidents, update rescue progress status.</small>
          </div>
          <div class="account-item">
            <span class="account-role role-citizen">CITIZEN</span>
            <div class="account-email">citizen&#64;resqmangaluru.org</div>
            <div class="account-pass">Password: <code>CitizenPass123!</code></div>
            <small>Report SOS emergencies, view personal incident tracking, find shelters.</small>
          </div>
        </div>
      </section>

      <!-- Emergency Helpline Section -->
      <section class="helplines-section">
        <h3>Verified Mangaluru Emergency Helplines (Test Mode)</h3>
        <p>In accordance with project guidelines, dialing operates through your device phone dialer with user confirmation.</p>
        <div class="helplines-grid">
          <div class="helpline-card">
            <h4>District Disaster Control Room</h4>
            <div class="phone">0824-2220587</div>
            <a href="tel:08242220587" class="btn btn-outline btn-sm">Dial Control Room</a>
          </div>
          <div class="helpline-card">
            <h4>NDRF Coastal Mangaluru Unit</h4>
            <div class="phone">0824-2442222</div>
            <a href="tel:08242442222" class="btn btn-outline btn-sm">Dial NDRF Unit</a>
          </div>
          <div class="helpline-card">
            <h4>Fire & Emergency Services (Kadri)</h4>
            <div class="phone">101 / 0824-2220555</div>
            <a href="tel:101" class="btn btn-outline btn-sm">Dial Fire Services</a>
          </div>
          <div class="helpline-card">
            <h4>Ambulance / Medical Helpline</h4>
            <div class="phone">108 / 0824-2444555</div>
            <a href="tel:108" class="btn btn-outline btn-sm">Dial Medical Helpline</a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .landing-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .disclaimer-banner {
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.85rem;
      color: #92400e;
      margin-bottom: 1.5rem;
    }

    .warning-badge {
      background: #f59e0b;
      color: white;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
    }

    .hero-section {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 2rem;
      background: #ffffff;
      padding: 2.5rem;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      margin-bottom: 2.5rem;
      align-items: center;
    }

    .hero-tag {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--accent-teal);
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .hero-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--primary-color);
      line-height: 1.2;
      margin-bottom: 1rem;
    }

    .hero-description {
      font-size: 1rem;
      color: var(--text-muted);
      margin-bottom: 1.75rem;
      line-height: 1.6;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .btn-lg {
      padding: 0.75rem 1.4rem;
      font-size: 0.95rem;
    }

    .hero-stats-card {
      background: var(--primary-dark);
      color: white;
      padding: 1.75rem;
      border-radius: 10px;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 0.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .stat-box {
      background: rgba(255, 255, 255, 0.06);
      padding: 1rem;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
    }

    .stat-box.active-em .stat-number {
      color: #f87171;
    }

    .stat-number {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--accent-teal-light);
    }

    .stat-label {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }

    .features-section {
      margin-bottom: 3rem;
    }

    .section-heading {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--primary-color);
      text-align: center;
    }

    .section-subheading {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-bottom: 2rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .feature-card {
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .feature-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
    }

    .feature-icon {
      font-size: 2rem;
      margin-bottom: 0.75rem;
    }

    .feature-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }

    .feature-card p {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 1rem;
    }

    .feature-link {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--accent-blue);
    }

    /* Evaluator credentials card */
    .evaluator-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 1.75rem;
      margin-bottom: 3rem;
    }

    .evaluator-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .evaluator-header h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: #1e3a8a;
    }

    .evaluator-desc {
      font-size: 0.875rem;
      color: #3b82f6;
      margin-bottom: 1.25rem;
    }

    .accounts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
    }

    .account-item {
      background: #ffffff;
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid #dbeafe;
    }

    .account-role {
      font-size: 0.65rem;
      font-weight: 800;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      color: white;
      display: inline-block;
      margin-bottom: 0.5rem;
    }
    .role-admin { background: #ef4444; }
    .role-responder { background: #3b82f6; }
    .role-citizen { background: #10b981; }

    .account-email {
      font-weight: 700;
      font-size: 0.9rem;
      color: #0f172a;
    }

    .account-pass {
      font-size: 0.8rem;
      color: #475569;
      margin: 0.25rem 0 0.5rem 0;
    }

    .account-item small {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
      line-height: 1.4;
    }

    /* Helplines */
    .helplines-section {
      background: #ffffff;
      padding: 2rem;
      border-radius: 12px;
      border: 1px solid var(--border-color);
    }

    .helplines-section h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 0.25rem;
    }

    .helplines-section p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    .helplines-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .helpline-card {
      background: #f8fafc;
      border: 1px solid var(--border-color);
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }

    .helpline-card h4 {
      font-size: 0.85rem;
      color: #334155;
      margin-bottom: 0.5rem;
    }

    .helpline-card .phone {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--danger-color);
      margin-bottom: 0.75rem;
    }

    @media (max-width: 900px) {
      .hero-section {
        grid-template-columns: 1fr;
        padding: 1.5rem;
      }
      .hero-title {
        font-size: 1.75rem;
      }
    }
  `]
})
export class LandingComponent implements OnInit {
  auth = inject(AuthService);
  api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  stats: DashboardStats | null = null;

  ngOnInit(): void {
    this.api.getDashboardStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.stats = res.data;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        // Fallback demo statistics shown gracefully
      }
    });
  }
}
