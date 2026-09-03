import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { isTokenExpired } from '../auth/jwt-token';
import { API_URLS, USER_ROLES } from '../../shared/constant/shared-constants';
import { AuthResponse, LoginRequest, RegisterRequest } from '../../shared/models/auth-request.model';
import { ApiMessage } from '../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<string | null>(localStorage.getItem('user'));
  readonly currentUser = this.currentUserSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}${API_URLS.AUTH.LOGIN}`, request)
      .pipe(tap(response => this.saveAuthData(response)));
  }

  register(request: RegisterRequest): Observable<ApiMessage> {
    return this.http.post<ApiMessage>(`${environment.apiUrl}${API_URLS.AUTH.REGISTER}`, request);
  }

  logout(): void {
    ['jwt_token', 'user', 'user_role', 'user_id', 'user_email'].forEach(key => localStorage.removeItem(key));
    this.currentUserSubject.next(null);
  }

  getToken(): string | null { return localStorage.getItem('jwt_token'); }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token || isTokenExpired(token)) {
      if (token) this.logout();
      return false;
    }
    return true;
  }

  getCurrentUser(): string | null { return this.currentUserSubject.value; }
  getUserRole(): string | null { return localStorage.getItem('user_role'); }
  getUserId(): string | null { return localStorage.getItem('user_id'); }
  getUserEmail(): string | null { return localStorage.getItem('user_email'); }
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
    localStorage.setItem('jwt_token', response.token);
    localStorage.setItem('user', response.user.username);
    localStorage.setItem('user_role', response.user.role);
    localStorage.setItem('user_id', response.user.id);
    localStorage.setItem('user_email', response.user.email);
    this.currentUserSubject.next(response.user.username);
  }
}
