import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'collaborator' | 'cooperative' | 'customer';
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  refreshToken?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _token = signal<string | null>(this.readToken());
  private readonly _user = signal<AuthUser | null>(this.readUser());

  readonly isAuthenticated = computed(() => !!this._token());
  readonly user = computed(() => this._user());

  login(identifier: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { identifier, password });
  }

  register(payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', payload);
  }

  forgotPassword(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>('/api/auth/forgot-password', { email });
  }

  resetPassword(payload: { email: string; otp: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/reset-password', payload);
  }

  adminResetPassword(payload: { email: string; resetSecret: string; password: string }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>('/api/auth/admin/reset', payload);
  }

  saveSession(response: AuthResponse, remember: boolean): void {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;
    otherStorage.removeItem('mocmac-auth-token');
    otherStorage.removeItem('mocmac-auth-user');
    otherStorage.removeItem('mocmac-refresh-token');
    storage.setItem('mocmac-auth-token', response.token);
    storage.setItem('mocmac-auth-user', JSON.stringify(response.user));
    if (response.refreshToken) storage.setItem('mocmac-refresh-token', response.refreshToken);
    this._token.set(response.token);
    this._user.set(response.user);
  }

  logout(): void {
    localStorage.removeItem('mocmac-auth-token');
    sessionStorage.removeItem('mocmac-auth-token');
    localStorage.removeItem('mocmac-auth-user');
    sessionStorage.removeItem('mocmac-auth-user');
    localStorage.removeItem('mocmac-refresh-token');
    sessionStorage.removeItem('mocmac-refresh-token');
    this._token.set(null);
    this._user.set(null);
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('mocmac-refresh-token') ?? sessionStorage.getItem('mocmac-refresh-token');
    return this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken });
  }

  replaceSession(response: AuthResponse): void {
    const storage = localStorage.getItem('mocmac-auth-token') ? localStorage : sessionStorage;
    storage.setItem('mocmac-auth-token', response.token);
    if (response.refreshToken) storage.setItem('mocmac-refresh-token', response.refreshToken);
    storage.setItem('mocmac-auth-user', JSON.stringify(response.user));
    this._token.set(response.token); this._user.set(response.user);
  }

  private readToken(): string | null {
    return localStorage.getItem('mocmac-auth-token') ?? sessionStorage.getItem('mocmac-auth-token');
  }

  private readUser(): AuthUser | null {
    const raw = localStorage.getItem('mocmac-auth-user') ?? sessionStorage.getItem('mocmac-auth-user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
