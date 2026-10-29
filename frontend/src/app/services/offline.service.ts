import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Incident } from '../models';

export interface QueuedIncident {
  id: string; // client temporary ID
  title: string;
  description: string;
  category: string;
  severity: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'failed' | 'synced';
  lastError?: string;
  serverIncidentId?: string;
}

export interface IncidentDraft {
  title: string;
  description: string;
  category: string;
  severity: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private http = inject(HttpClient);
  private readonly QUEUE_KEY = 'resqnet_offline_incident_queue';
  private readonly DRAFT_KEY = 'resqnet_sos_draft';

  // Reactive online/offline state
  isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  isSyncing = signal<boolean>(false);
  queuedIncidents = signal<QueuedIncident[]>(this.loadQueue());
  draft = signal<IncidentDraft | null>(this.loadDraft());

  pendingCount = computed(() => {
    return this.queuedIncidents().filter(i => i.syncStatus === 'pending' || i.syncStatus === 'failed').length;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline.set(true);
        // Automatically attempt background sync when back online
        this.syncQueuedIncidents();
      });

      window.addEventListener('offline', () => {
        this.isOnline.set(false);
      });
    }
  }

  // --- DRAFT MANAGEMENT ---
  saveDraft(data: IncidentDraft): void {
    data.updatedAt = new Date().toISOString();
    localStorage.setItem(this.DRAFT_KEY, JSON.stringify(data));
    this.draft.set(data);
  }

  loadDraft(): IncidentDraft | null {
    if (typeof localStorage === 'undefined') return null;
    const str = localStorage.getItem(this.DRAFT_KEY);
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  clearDraft(): void {
    localStorage.removeItem(this.DRAFT_KEY);
    this.draft.set(null);
  }

  // --- QUEUE MANAGEMENT FOR OFFLINE INCIDENTS ---
  enqueueIncident(incidentData: {
    title: string;
    description: string;
    category: string;
    severity: string;
    address: string;
    latitude: number;
    longitude: number;
    contactPhone: string;
  }): QueuedIncident {
    const item: QueuedIncident = {
      ...incidentData,
      id: 'offline-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
      syncStatus: 'pending'
    };

    const current = this.loadQueue();
    const updated = [item, ...current];
    this.saveQueue(updated);
    this.clearDraft(); // remove draft once enqueued
    return item;
  }

  removeQueuedIncident(id: string): void {
    const current = this.loadQueue().filter(i => i.id !== id);
    this.saveQueue(current);
  }

  clearCompleted(): void {
    const current = this.loadQueue().filter(i => i.syncStatus !== 'synced');
    this.saveQueue(current);
  }

  // --- SYNCHRONIZATION ---
  async syncQueuedIncidents(): Promise<{ successCount: number; failCount: number }> {
    if (!this.isOnline() || this.isSyncing()) {
      return { successCount: 0, failCount: 0 };
    }

    const queue = this.loadQueue();
    const toSync = queue.filter(item => item.syncStatus === 'pending' || item.syncStatus === 'failed');

    if (toSync.length === 0) {
      return { successCount: 0, failCount: 0 };
    }

    this.isSyncing.set(true);
    let successCount = 0;
    let failCount = 0;

    for (const item of toSync) {
      item.syncStatus = 'syncing';
      this.updateItemInQueue(item);

      try {
        const payload = {
          title: item.title,
          description: item.description,
          category: item.category,
          severity: item.severity,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          contactPhone: item.contactPhone
        };

        const res = await this.http.post<{ success: boolean; data: Incident }>(
          `${environment.apiUrl}/incidents`,
          payload
        ).toPromise();

        if (res && res.success) {
          item.syncStatus = 'synced';
          item.serverIncidentId = res.data._id;
          item.lastError = undefined;
          successCount++;
        } else {
          item.syncStatus = 'failed';
          item.lastError = 'Server returned unsuccessful status';
          failCount++;
        }
      } catch (err: any) {
        item.syncStatus = 'failed';
        item.lastError = err?.error?.message || err?.message || 'Network or server error';
        failCount++;
      }

      this.updateItemInQueue(item);
    }

    this.isSyncing.set(false);
    return { successCount, failCount };
  }

  private loadQueue(): QueuedIncident[] {
    if (typeof localStorage === 'undefined') return [];
    const str = localStorage.getItem(this.QUEUE_KEY);
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  }

  private saveQueue(queue: QueuedIncident[]): void {
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    this.queuedIncidents.set(queue);
  }

  private updateItemInQueue(updatedItem: QueuedIncident): void {
    const queue = this.loadQueue();
    const idx = queue.findIndex(q => q.id === updatedItem.id);
    if (idx !== -1) {
      queue[idx] = updatedItem;
      this.saveQueue(queue);
    }
  }
}
