import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SocketService } from '../../services/socket.service';
import { NotificationItem } from '../../models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="notifications-container">
      <div class="page-top">
        <div>
          <h2>🔔 Disaster Broadcasts & Notifications</h2>
          <p>Real-time emergency alerts and operational incident updates powered by Socket.IO.</p>
        </div>
        <button class="btn btn-outline btn-sm" (click)="markAllAsRead()">Mark All as Read</button>
      </div>

      @if (notifications.length === 0) {
        <div class="empty-box">
          <div class="empty-icon">📭</div>
          <p>No new notifications at this time.</p>
        </div>
      } @else {
        <div class="notifications-list">
          @for (n of notifications; track n._id) {
            <div class="notification-card" [class.unread]="!n.isRead">
              <div class="n-icon">
                @if (n.type === 'emergency') {
                  🚨
                } @else if (n.type === 'shelter') {
                  ⛺
                } @else {
                  ℹ️
                }
              </div>

              <div class="n-content">
                <div class="n-header">
                  <span class="n-title">{{ n.title }}</span>
                  <span class="n-time">{{ n.createdAt | date:'short' }}</span>
                </div>
                <div class="n-msg">{{ n.message }}</div>

                <div class="n-footer">
                  @if (n.incidentId) {
                    <a [routerLink]="['/incidents', n.incidentId]" class="n-link">View Related Incident →</a>
                  }
                  @if (!n.isRead) {
                    <button class="btn-read" (click)="markRead(n)">Mark Read</button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .notifications-container {
      max-width: 900px;
      margin: 0 auto;
    }
    .page-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
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
    .empty-box {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 3rem;
      text-align: center;
      color: var(--text-muted);
    }
    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .notification-card {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      box-shadow: var(--shadow-sm);
      transition: background 0.2s;
    }
    .notification-card.unread {
      background: #f0fdfa;
      border-color: #99f6e4;
    }
    .n-icon {
      font-size: 1.5rem;
      background: #f1f5f9;
      width: 42px;
      height: 42px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .n-content {
      flex: 1;
    }
    .n-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 0.25rem;
    }
    .n-time {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 400;
    }
    .n-msg {
      font-size: 0.85rem;
      color: #334155;
      margin-bottom: 0.5rem;
    }
    .n-footer {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .n-link {
      font-size: 0.75rem;
      color: var(--accent-blue);
      font-weight: 600;
    }
    .btn-read {
      background: transparent;
      border: none;
      font-size: 0.75rem;
      color: #64748b;
      cursor: pointer;
      text-decoration: underline;
    }
  `]
})
export class NotificationsComponent implements OnInit {
  api = inject(ApiService);
  socket = inject(SocketService);
  notifications: NotificationItem[] = [];

  ngOnInit(): void {
    this.loadNotifications();

    this.socket.onEvent('incident_created').subscribe(() => this.loadNotifications());
    this.socket.onEvent('incident_updated').subscribe(() => this.loadNotifications());
  }

  loadNotifications(): void {
    this.api.getNotifications().subscribe({
      next: (res) => { if (res.success) this.notifications = res.data; }
    });
  }

  markRead(n: NotificationItem): void {
    this.api.markNotificationRead(n._id).subscribe({
      next: () => { n.isRead = true; }
    });
  }

  markAllAsRead(): void {
    this.api.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.forEach((n) => n.isRead = true);
      }
    });
  }
}
