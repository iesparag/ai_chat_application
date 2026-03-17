import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser & { _id?: string };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private tokenSubject = new BehaviorSubject<string | null>(localStorage.getItem('token'));
  private authSubject = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
  private userSubject = new BehaviorSubject<AuthUser | null>(this.getStoredUser());

  constructor(private http: HttpClient, private router: Router) {}

  private getStoredUser(): AuthUser | null {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }

  signup(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/signup`, { name, email, password }).pipe(
      tap(response => this.setSession(response))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, { email, password }).pipe(
      tap(response => this.setSession(response))
    );
  }

  private setSession(authResult: AuthResponse): void {
    const u = authResult.user;
    const safeUser: AuthUser = u ? { id: u.id || u._id, name: u.name, email: u.email } : null as any;
    localStorage.setItem('token', authResult.token);
    if (safeUser) {
      localStorage.setItem('user', JSON.stringify(safeUser));
      this.userSubject.next(safeUser);
    }
    this.tokenSubject.next(authResult.token);
    this.authSubject.next(true);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.tokenSubject.next(null);
    this.userSubject.next(null);
    this.authSubject.next(false);
    this.router.navigate(['/login']);
  }

  getUser(): Observable<AuthUser | null> {
    return this.userSubject.asObservable();
  }

  getToken(): Observable<string | null> {
    return this.tokenSubject.asObservable();
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  isAuthenticatedAsObservable(): Observable<boolean> {
    return this.authSubject.asObservable();
  }
}