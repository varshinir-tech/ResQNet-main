import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Incident,
  Shelter,
  Volunteer,
  Donation,
  NotificationItem,
  DashboardStats,
  User
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Health
  checkHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // Incidents
  getIncidents(params?: { status?: string; category?: string; severity?: string; myOnly?: boolean; assignedOnly?: boolean }): Observable<{ success: boolean; count: number; data: Incident[] }> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.category) httpParams = httpParams.set('category', params.category);
      if (params.severity) httpParams = httpParams.set('severity', params.severity);
      if (params.myOnly !== undefined) httpParams = httpParams.set('myOnly', String(params.myOnly));
      if (params.assignedOnly !== undefined) httpParams = httpParams.set('assignedOnly', String(params.assignedOnly));
    }
    return this.http.get<{ success: boolean; count: number; data: Incident[] }>(`${this.baseUrl}/incidents`, { params: httpParams });
  }

  getIncidentById(id: string): Observable<{ success: boolean; data: Incident }> {
    return this.http.get<{ success: boolean; data: Incident }>(`${this.baseUrl}/incidents/${id}`);
  }

  createIncident(data: any): Observable<{ success: boolean; message: string; data: Incident }> {
    return this.http.post<{ success: boolean; message: string; data: Incident }>(`${this.baseUrl}/incidents`, data);
  }

  updateIncidentStatus(id: string, payload: { status?: string; comment?: string; assignedResponderId?: string }): Observable<{ success: boolean; message: string; data: Incident }> {
    return this.http.put<{ success: boolean; message: string; data: Incident }>(`${this.baseUrl}/incidents/${id}/status`, payload);
  }

  deleteIncident(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/incidents/${id}`);
  }

  // Shelters
  getShelters(status?: string): Observable<{ success: boolean; count: number; data: Shelter[] }> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<{ success: boolean; count: number; data: Shelter[] }>(`${this.baseUrl}/shelters`, { params });
  }

  createShelter(shelter: Partial<Shelter>): Observable<any> {
    return this.http.post(`${this.baseUrl}/shelters`, shelter);
  }

  updateShelter(id: string, shelter: Partial<Shelter>): Observable<any> {
    return this.http.put(`${this.baseUrl}/shelters/${id}`, shelter);
  }

  deleteShelter(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/shelters/${id}`);
  }

  // Volunteers
  getVolunteers(): Observable<{ success: boolean; count: number; data: Volunteer[] }> {
    return this.http.get<{ success: boolean; count: number; data: Volunteer[] }>(`${this.baseUrl}/volunteers`);
  }

  createVolunteer(volunteer: Partial<Volunteer>): Observable<any> {
    return this.http.post(`${this.baseUrl}/volunteers`, volunteer);
  }

  updateVolunteer(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/volunteers/${id}`, data);
  }

  deleteVolunteer(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/volunteers/${id}`);
  }

  // Donations
  getDonations(): Observable<{ success: boolean; totals: { totalMonetary: number; totalSuppliesCount: number }; data: Donation[] }> {
    return this.http.get<{ success: boolean; totals: { totalMonetary: number; totalSuppliesCount: number }; data: Donation[] }>(`${this.baseUrl}/donations`);
  }

  createDonation(donation: Partial<Donation>): Observable<any> {
    return this.http.post(`${this.baseUrl}/donations`, donation);
  }

  updateDonation(id: string, donation: Partial<Donation>): Observable<any> {
    return this.http.put(`${this.baseUrl}/donations/${id}`, donation);
  }

  deleteDonation(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/donations/${id}`);
  }

  // Notifications
  getNotifications(): Observable<{ success: boolean; count: number; data: NotificationItem[] }> {
    return this.http.get<{ success: boolean; count: number; data: NotificationItem[] }>(`${this.baseUrl}/notifications`);
  }

  markNotificationRead(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<any> {
    return this.http.put(`${this.baseUrl}/notifications/mark-all-read`, {});
  }

  // Dashboard & Users
  getDashboardStats(): Observable<{ success: boolean; data: DashboardStats }> {
    return this.http.get<{ success: boolean; data: DashboardStats }>(`${this.baseUrl}/dashboard/stats`);
  }

  getResponders(): Observable<{ success: boolean; count: number; data: User[] }> {
    return this.http.get<{ success: boolean; count: number; data: User[] }>(`${this.baseUrl}/users/responders`);
  }
}
