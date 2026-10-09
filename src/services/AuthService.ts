/**
 * AuthService - Client-side JWT authentication service for Lyraa
 */

import { AuthResponse, UserProfile } from '../types';

const TOKEN_KEY = 'lyraa_jwt_token';
const USER_KEY = 'lyraa_user_profile';

class AuthService {
  private token: string | null = null;
  private user: UserProfile | null = null;
  private listeners: Set<(user: UserProfile | null) => void> = new Set();

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
    const cachedUser = localStorage.getItem(USER_KEY);
    if (cachedUser) {
      try {
        this.user = JSON.parse(cachedUser);
      } catch {}
    }
  }

  public subscribe(cb: (user: UserProfile | null) => void): () => void {
    this.listeners.add(cb);
    cb(this.user);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.user));
  }

  public getToken(): string | null {
    return this.token;
  }

  public getUser(): UserProfile | null {
    return this.user;
  }

  public isAuthenticated(): boolean {
    return Boolean(this.token && this.user);
  }

  public async register(params: {
    email: string;
    password: string;
    name: string;
    preferredVoice?: string;
    preferredTheme?: string;
  }): Promise<UserProfile> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    this.saveSession(data as AuthResponse);
    return data.user;
  }

  public async login(email: string, password: string): Promise<UserProfile> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    this.saveSession(data as AuthResponse);
    return data.user;
  }

  public async fetchCurrentProfile(): Promise<UserProfile | null> {
    if (!this.token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          this.logout();
        }
        return null;
      }

      const data = await res.json();
      this.user = data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      this.notify();
      return data.user;
    } catch {
      return this.user;
    }
  }

  public async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!this.token) {
      throw new Error('Not authenticated.');
    }

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(updates),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile.');
    }

    this.user = data.user;
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    this.notify();
    return data.user;
  }

  public logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.notify();
  }

  private saveSession(auth: AuthResponse): void {
    this.token = auth.token;
    this.user = auth.user;
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    this.notify();
  }
}

export const authService = new AuthService();
