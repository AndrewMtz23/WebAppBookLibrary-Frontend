import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { isTokenExpired } from '../auth/jwt-token';
import { API_URLS, USER_ROLES } from '../../shared/constant/shared-constants';
import { AuthResponse, LoginRequest, RegisterRequest } from '../../shared/models/auth-request.model';
import { ApiMessage } from '../../shared/models/api-response.model';
import { AuthenticatedUser, AuthSession, isAuthSession, isUserRole } from '../auth/auth-session.model';

const SESSION_STORAGE_KEY = 'booklibrary_session';
const LEGACY_STORAGE_KEYS = ['jwt_token', 'user', 'user_role', 'user_id', 'user_email'] as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(this.restoreSession());
  readonly session$ = this.sessionSubject.asObservable();
  readonly currentUser = this.session$.pipe(
    map(session => session?.user.username ?? null),
    distinctUntilChanged()
  );

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}${API_URLS.AUTH.LOGIN}`, request)
      .pipe(tap(response => this.saveAuthData(response)));
  }

  register(request: RegisterRequest): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${environment.apiUrl}${API_URLS.AUTH.REGISTER}`, request);
  }

  logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    this.sessionSubject.next(null);
  }

  syncCurrentUser(user: AuthenticatedUser): void {
    const session = this.sessionSnapshot;
    if (!session || session.user.id !== user.id || session.user.username !== user.username || session.user.role !== user.role) return;
    const updated = { ...session, user };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
    this.sessionSubject.next(updated);
  }

  get sessionSnapshot(): AuthSession | null { return this.sessionSubject.value; }
  get isAuthenticated(): boolean { return this.isLoggedIn(); }
  getToken(): string | null { return this.sessionSnapshot?.token ?? null; }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token || isTokenExpired(token)) {
      if (token) this.logout();
      return false;
    }
    return true;
  }

  getCurrentUser(): string | null { return this.sessionSnapshot?.user.username ?? null; }
  getUserRole(): string | null { return this.sessionSnapshot?.user.role ?? null; }
  getUserId(): string | null { return this.sessionSnapshot?.user.id ?? null; }
  getUserEmail(): string | null { return this.sessionSnapshot?.user.email ?? null; }
  hasRole(roles: string[]): boolean { const role = this.getUserRole(); return role !== null && roles.includes(role); }
  isAdmin(): boolean { return this.getUserRole() === USER_ROLES.ADMIN; }
  isLibrarian(): boolean { return this.getUserRole() === USER_ROLES.LIBRARIAN; }
  isUser(): boolean { return this.getUserRole() === USER_ROLES.USER; }
  isAdminOrLibrarian(): boolean { return this.isAdmin() || this.isLibrarian(); }
  canCreateBooks(): boolean { return this.isAdminOrLibrarian(); }
  canEditBooks(): boolean { return this.isAdminOrLibrarian(); }
  canDeleteBooks(): boolean { return this.isAdmin(); }
  canViewAllLoans(): boolean { return this.isAdmin(); }
  canManageLoans(): boolean { return this.isAdminOrLibrarian(); }
  canViewLogs(): boolean { return this.isAdmin(); }

  getRoleDisplayName(): string {
    switch (this.getUserRole()) {
      case USER_ROLES.ADMIN: return 'Administrador';
      case USER_ROLES.LIBRARIAN: return 'Bibliotecario';
      case USER_ROLES.USER: return 'Usuario';
      default: return 'Invitado';
    }
  }

  hasPermission(action: string): boolean {
    const permissions: Record<string, boolean> = {
      'view-logs': this.canViewLogs(), 'create-books': this.canCreateBooks(),
      'edit-books': this.canEditBooks(), 'delete-books': this.canDeleteBooks(),
      'manage-loans': this.canManageLoans(), 'view-all-loans': this.canViewAllLoans()
    };
    return permissions[action] ?? false;
  }

  private saveAuthData(response: AuthResponse): void {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response));
    LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    this.sessionSubject.next(response);
  }

  private restoreSession(): AuthSession | null {
    const persisted = localStorage.getItem(SESSION_STORAGE_KEY);

    if (persisted) {
      try {
        const session: unknown = JSON.parse(persisted);
        if (isAuthSession(session) && !isTokenExpired(session.token)) return session;
      } catch {
        // Invalid local data is cleared below.
      }

      localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    const token = localStorage.getItem('jwt_token');
    const role = localStorage.getItem('user_role');
    const id = localStorage.getItem('user_id');
    const username = localStorage.getItem('user');
    const email = localStorage.getItem('user_email');

    if (token && !isTokenExpired(token) && isUserRole(role) && id && username && email) {
      const session: AuthSession = { token, user: { id, username, email, role } };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
      return session;
    }

    LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    return null;
  }
}
