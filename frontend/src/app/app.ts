import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { OfflineService } from './services/offline.service';
import { SocketService } from './services/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-layout">
      <!-- Dark Navy Sidebar -->
      <aside class="sidebar" [class.mobile-open]="isSidebarOpen">
        <div class="sidebar-brand">
          <div class="brand-logo">
            <span class="brand-icon">⚡</span>
            <div class="brand-text">
              <span class="brand-title">ResQNet</span>
              <span class="brand-subtitle">Disaster Response System</span>
            </div>
          </div>
          <button class="close-sidebar-btn" (click)="toggleSidebar()">✕</button>
        </div>

        <!-- Role Badge -->
        @if (auth.isLoggedIn()) {
          <div class="user-role-badge">
            <div class="avatar-circle">{{ (auth.currentUser()?.name || 'U')[0] }}</div>
            <div class="user-info">
              <div class="user-name">{{ auth.currentUser()?.name }}</div>
              <div class="role-tag" [ngClass]="'role-' + auth.currentUser()?.role">
                {{ auth.currentUser()?.role | uppercase }}
              </div>
            </div>
          </div>
        }

        <!-- Navigation Links -->
        <nav class="nav-menu">
          <div class="nav-section-title">CORE NAVIGATION</div>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeSidebarOnMobile()" class="nav-item">
            <span class="icon">🏠</span> <span>Home / Overview</span>
          </a>

          @if (auth.isAdmin()) {
            <a routerLink="/admin-dashboard" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-item highlight-admin">
              <span class="icon">📊</span> <span>Admin Dashboard</span>
            </a>
          }

          @if (auth.isLoggedIn()) {
            <a routerLink="/citizen-dashboard" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-item">
              <span class="icon">📋</span> <span>Operations Dashboard</span>
            </a>
            <a routerLink="/report-sos" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-item nav-sos">
              <span class="icon">🚨</span> <span>Report SOS / Incident</span>
              @if (offline.pendingCount() > 0) {
                <span class="offline-badge-pill">{{ offline.pendingCount() }} offline</span>
              }
            </a>
            <a routerLink="/my-reports" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-item">
              <span class="icon">📑</span> <span>Emergency Reports</span>
            </a>
          }

          <div class="nav-section-title">RESPONSE & RELIEF</div>
          <a routerLink="/map" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-item">
            <span class="icon">🗺️</span> <span>Interactive Map</span>
          </a>
          <a routerLink="/shelters" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-item">
            <span class="icon">⛺</span> <span>Shelters & Camps</span>
          </a>
          <a routerLink="/volunteers" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-item">
            <span class="icon">🤝</span> <span>Volunteers</span>
          </a>
          <a routerLink="/donations" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-item">
            <span class="icon">🎁</span> <span>Donation Tracking</span>
          </a>

          @if (auth.isLoggedIn()) {
            <div class="nav-section-title">USER ACCOUNT</div>
            <a routerLink="/notifications" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-item">
              <span class="icon">🔔</span> <span>Notifications</span>
            </a>
            <a routerLink="/profile" routerLinkActive="active" (click)="closeSidebarOnMobile()" class="nav-item">
              <span class="icon">👤</span> <span>Profile Details</span>
            </a>
          }
        </nav>

        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          @if (auth.isLoggedIn()) {
            <button class="logout-btn" (click)="logout()">
              <span>🚪 Sign Out</span>
            </button>
          } @else {
            <a routerLink="/login" class="login-sidebar-btn" (click)="closeSidebarOnMobile()">
              <span>🔑 Sign In / Register</span>
            </a>
          }
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="main-wrapper">
        <!-- Persistent Offline / Online Status Banner -->
        @if (!offline.isOnline()) {
          <div class="global-network-banner offline-banner">
            <div class="banner-content">
              <span class="banner-icon">📡❌</span>
              <div class="banner-text">
                <strong>Offline Mode Active:</strong> You have no active internet connection. You can still browse cached pages and draft emergency SOS reports locally.
                <span class="banner-warning-note">⚠️ Note: Emergency reports submitted while offline are stored on your device and will sync once internet returns.</span>
              </div>
            </div>
            @if (offline.pendingCount() > 0) {
              <div class="pending-sync-tag">
                <span>{{ offline.pendingCount() }} report(s) queued for sync</span>
              </div>
            }
          </div>
        } @else if (offline.pendingCount() > 0) {
          <div class="global-network-banner syncing-banner">
            <div class="banner-content">
              <span class="banner-icon">🔄</span>
              <div class="banner-text">
                <strong>Internet Restored:</strong> You have <strong>{{ offline.pendingCount() }}</strong> queued offline incident report(s) waiting to sync to the server.
              </div>
            </div>
            <button class="sync-now-btn" [disabled]="offline.isSyncing()" (click)="triggerManualSync()">
              @if (offline.isSyncing()) {
                <span>Syncing now...</span>
              } @else {
                <span>Sync Reports Now</span>
              }
            </button>
          </div>
        }

        <!-- Top Navbar -->
        <header class="topbar">
          <div class="topbar-left">
            <button class="menu-toggle" (click)="toggleSidebar()">☰</button>
            <div class="mangaluru-pill">
              <span class="status-indicator" [class.status-offline]="!offline.isOnline()"></span>
              <span>Mangaluru Coastal Command</span>
            </div>

            <!-- Online / Offline Network Badge -->
            <div class="network-badge" [class.badge-offline]="!offline.isOnline()">
              @if (offline.isOnline()) {
                <span class="dot-online"></span>
                <span>Online</span>
              } @else {
                <span class="dot-offline"></span>
                <span>Offline Mode</span>
              }
            </div>

            <!-- Real-time Socket.IO Connection State -->
            @if (offline.isOnline()) {
              <div class="socket-badge" [ngClass]="'socket-' + socket.connectionState()">
                @if (socket.connectionState() === 'connected') {
                  <span class="socket-dot"></span> Live Real-time Connected
                } @else if (socket.connectionState() === 'reconnecting') {
                  <span class="socket-dot spin"></span> Reconnecting Real-time...
                } @else {
                  <span class="socket-dot disconnected"></span> Real-time Disconnected
                }
              </div>
            }
          </div>

          <div class="topbar-right">
            <div class="emergency-helpline-box">
              <span class="helpline-label">Test Mode Helpline:</span>
              <a href="tel:08242220001" class="helpline-link">0824-2220001</a>
            </div>

            @if (!auth.isLoggedIn()) {
              <a routerLink="/login" class="btn btn-primary btn-sm">Sign In</a>
            } @else {
              <a routerLink="/report-sos" class="btn btn-danger btn-sm">🚨 Quick SOS</a>
            }
          </div>
        </header>

        <!-- Dynamic Page Router Outlet -->
        <main class="page-body">
          <router-outlet></router-outlet>
        </main>

        <!-- Footer -->
        <footer class="app-footer">
          <div>
            <strong>ResQNet</strong> — Disaster Relief & Emergency Response Information Portal
            <span class="badge badge-demo">MCA Final Project Demo</span>
          </div>
          <div class="footer-subtext">
            PWA & Offline-Capable Emergency Coordination | Dakshina Kannada, Mangaluru, Karnataka.
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background-color: var(--bg-light);
    }

    /* Global Network Banner */
    .global-network-banner {
      padding: 0.65rem 1.5rem;
      font-size: 0.85rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      z-index: 60;
    }

    .offline-banner {
      background-color: #fee2e2;
      border-bottom: 1px solid #fca5a5;
      color: #991b1b;
    }

    .syncing-banner {
      background-color: #ecfdf5;
      border-bottom: 1px solid #a7f3d0;
      color: #065f46;
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .banner-icon {
      font-size: 1.25rem;
    }

    .banner-text {
      line-height: 1.4;
    }

    .banner-warning-note {
      display: block;
      font-size: 0.75rem;
      color: #b91c1c;
      margin-top: 0.15rem;
    }

    .pending-sync-tag {
      background: rgba(185, 28, 28, 0.12);
      border: 1px solid rgba(185, 28, 28, 0.25);
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .sync-now-btn {
      background: #059669;
      color: #ffffff;
      border: none;
      padding: 0.35rem 0.85rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }

    .sync-now-btn:hover:not(:disabled) {
      background: #047857;
    }

    .sync-now-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Dark Navy Sidebar */
    .sidebar {
      width: var(--sidebar-width);
      background-color: var(--primary-dark);
      color: #cbd5e1;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 100;
      transition: transform 0.3s ease;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    }

    .sidebar-brand {
      padding: 1.25rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .brand-icon {
      font-size: 1.5rem;
      background: rgba(13, 148, 136, 0.2);
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
    }

    .brand-title {
      font-weight: 700;
      font-size: 1.05rem;
      color: #ffffff;
      display: block;
      letter-spacing: -0.01em;
    }

    .brand-subtitle {
      font-size: 0.7rem;
      color: #94a3b8;
      display: block;
    }

    .close-sidebar-btn {
      display: none;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.25rem;
      cursor: pointer;
    }

    .user-role-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1.25rem;
      background-color: rgba(255, 255, 255, 0.04);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .avatar-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--accent-teal);
      color: white;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-info {
      overflow: hidden;
    }

    .user-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    .role-tag {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      display: inline-block;
      margin-top: 2px;
    }
    .role-admin { background: #ef4444; color: white; }
    .role-responder { background: #3b82f6; color: white; }
    .role-citizen { background: #10b981; color: white; }

    .nav-menu {
      flex: 1;
      padding: 1rem 0.75rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-section-title {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.05em;
      margin: 0.85rem 0.6rem 0.35rem 0.6rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #cbd5e1;
      border-radius: 6px;
      transition: all 0.2s;
      position: relative;
    }

    .nav-item:hover {
      background-color: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }

    .nav-item.active {
      background-color: var(--accent-teal);
      color: #ffffff;
      font-weight: 600;
    }

    .nav-sos {
      background-color: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
      font-weight: 600;
      margin-top: 0.25rem;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .nav-sos:hover {
      background-color: rgba(239, 68, 68, 0.3);
      color: #ffffff;
    }

    .offline-badge-pill {
      margin-left: auto;
      font-size: 0.65rem;
      background: #ef4444;
      color: white;
      padding: 0.1rem 0.4rem;
      border-radius: 9999px;
      font-weight: 700;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .logout-btn, .login-sidebar-btn {
      width: 100%;
      padding: 0.55rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      text-align: center;
      display: block;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(255, 255, 255, 0.05);
      color: #e2e8f0;
      transition: background 0.2s;
    }
    .logout-btn:hover, .login-sidebar-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    /* Main Wrapper */
    .main-wrapper {
      margin-left: var(--sidebar-width);
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* Topbar */
    .topbar {
      height: var(--header-height);
      background-color: #ffffff;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: var(--shadow-sm);
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex-wrap: wrap;
    }

    .menu-toggle {
      display: none;
      background: transparent;
      border: none;
      font-size: 1.35rem;
      cursor: pointer;
      color: var(--text-main);
    }

    .mangaluru-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #f1f5f9;
      padding: 0.3rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #334155;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--success-color);
    }
    .status-indicator.status-offline {
      background-color: var(--danger-color);
    }

    /* Network state pill */
    .network-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.55rem;
      border-radius: 9999px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .network-badge.badge-offline {
      background: #fee2e2;
      color: #991b1b;
      border-color: #fecaca;
    }

    .dot-online {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
    }
    .dot-offline {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #ef4444;
    }

    /* Socket badge */
    .socket-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-weight: 600;
      background: #f8fafc;
      border: 1px solid var(--border-color);
      color: #475569;
    }
    .socket-connected { color: #0284c7; }
    .socket-reconnecting { color: #d97706; }
    .socket-disconnected { color: #dc2626; }

    .socket-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #0284c7;
    }
    .socket-dot.disconnected { background: #dc2626; }
    .socket-dot.spin {
      background: #d97706;
      animation: pulse 1s infinite;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .emergency-helpline-box {
      font-size: 0.8rem;
      background: #fef2f2;
      border: 1px solid #fee2e2;
      padding: 0.3rem 0.65rem;
      border-radius: 6px;
      color: #991b1b;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .helpline-link {
      font-weight: 700;
      text-decoration: underline;
    }

    .btn-sm {
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
    }

    /* Page Body */
    .page-body {
      flex: 1;
      padding: 1.5rem;
      background-color: #f8fafc;
    }

    /* Footer */
    .app-footer {
      background-color: #ffffff;
      border-top: 1px solid var(--border-color);
      padding: 1rem 1.5rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    @media (max-width: 900px) {
      .sidebar {
        transform: translateX(-100%);
      }
      .sidebar.mobile-open {
        transform: translateX(0);
      }
      .main-wrapper {
        margin-left: 0;
      }
      .menu-toggle {
        display: block;
      }
      .close-sidebar-btn {
        display: block;
      }
      .emergency-helpline-box {
        display: none;
      }
      .socket-badge {
        display: none;
      }
    }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  offline = inject(OfflineService);
  socket = inject(SocketService);
  isSidebarOpen = false;

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth <= 900) {
      this.isSidebarOpen = false;
    }
  }

  logout(): void {
    this.auth.logout();
    window.location.href = '/login';
  }

  triggerManualSync(): void {
    this.offline.syncQueuedIncidents().then(({ successCount, failCount }) => {
      if (successCount > 0) {
        alert(`Successfully synchronized ${successCount} queued emergency report(s) to the backend.`);
      } else if (failCount > 0) {
        alert(`Failed to sync queued report(s). Please verify the backend server is reachable.`);
      }
    });
  }
}
