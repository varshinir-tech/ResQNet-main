import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, AuthResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'resq_auth_token';
  private readonly USER_KEY = 'resq_auth_user';

  // Signals for reactive modern state
  currentUser = signal<User | null>(this.getStoredUser());
  token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  isResponder = computed(() => this.currentUser()?.role === 'responder');
  isCitizen = computed(() => this.currentUser()?.role === 'citizen');

  constructor(private http: HttpClient) {}

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap((res) => {
        if (res.success && res.token) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.success && res.token) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put<{ success: boolean; user: User }>(`${this.apiUrl}/profile`, data).pipe(
      tap((res) => {
        if (res.success && res.user) {
          this.currentUser.set(res.user);
          localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        }
      })
    );
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
