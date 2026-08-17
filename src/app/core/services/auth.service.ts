// 📁 core/services/auth.service.ts - CON DEBUG TEMPORAL
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_URLS, USER_ROLES } from '../../shared/constant/shared-constants';
import { LoginRequest, RegisterRequest, AuthResponse } from '../../shared/models/auth-request.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject: BehaviorSubject<string | null>;
  public currentUser: Observable<string | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<string | null>(localStorage.getItem('user'));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  hasRole(roles: string[]): boolean {
    const role = this.getUserRole();
    return role ? roles.includes(role) : false;
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${API_URLS.AUTH.LOGIN}`,
      request
    ).pipe(
      tap(response => {
        console.log('🔍 LOGIN DEBUG - Response:', response);
        console.log('🔍 LOGIN DEBUG - User role from backend:', response.user.role);
        this.saveAuthData(response);
      })
    );
  }

  register(request: RegisterRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}${API_URLS.AUTH.REGISTER}`, request);
  }

  logout() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    this.currentUserSubject.next(null);
  }

  private saveAuthData(authResponse: AuthResponse) {
    localStorage.setItem('jwt_token', authResponse.token);
    localStorage.setItem('user', authResponse.user.username);
    localStorage.setItem('user_role', authResponse.user.role);
    localStorage.setItem('user_id', authResponse.user.id);
    localStorage.setItem('user_email', authResponse.user.email);
    this.currentUserSubject.next(authResponse.user.username);
    
    // 🔍 DEBUG TEMPORAL
    console.log('🔍 SAVE DEBUG - Saved role:', authResponse.user.role);
    console.log('🔍 SAVE DEBUG - Available roles:', USER_ROLES);
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): string | null {
    return this.currentUserSubject.value;
  }

  getUserRole(): string | null {
    const role = localStorage.getItem('user_role');
    // 🔍 DEBUG TEMPORAL
    console.log('🔍 GET ROLE DEBUG - Retrieved role:', role);
    return role;
  }

  getUserId(): string | null {
    return localStorage.getItem('user_id');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('user_email');
  }

  // Role checking methods - CON DEBUG TEMPORAL
  isAdmin(): boolean {
    const role = this.getUserRole();
    const result = role === USER_ROLES.ADMIN;
    console.log('🔍 IS ADMIN DEBUG:');
    console.log('  - Current role:', role);
    console.log('  - Expected ADMIN role:', USER_ROLES.ADMIN);
    console.log('  - Match:', result);
    return result;
  }

  isLibrarian(): boolean {
    const role = this.getUserRole();
    const result = role === USER_ROLES.LIBRARIAN;
    console.log('🔍 IS LIBRARIAN DEBUG:', result, 'Role:', role, 'Expected:', USER_ROLES.LIBRARIAN);
    return result;
  }

  isUser(): boolean {
    const role = this.getUserRole();
    const result = role === USER_ROLES.USER;
    console.log('🔍 IS USER DEBUG:', result, 'Role:', role, 'Expected:', USER_ROLES.USER);
    return result;
  }

  isAdminOrLibrarian(): boolean {
    const role = this.getUserRole();
    return role === USER_ROLES.ADMIN || role === USER_ROLES.LIBRARIAN;
  }

  // Permission methods
  canCreateBooks(): boolean {
    return this.isAdminOrLibrarian();
  }

  canEditBooks(): boolean {
    return this.isAdminOrLibrarian();
  }

  canDeleteBooks(): boolean {
    return this.isAdmin();
  }

  canViewAllLoans(): boolean {
    return this.isAdmin();
  }

  canManageLoans(): boolean {
    return this.isAdminOrLibrarian();
  }

  canViewLogs(): boolean {
    const result = this.isAdmin();
    console.log('🔍 CAN VIEW LOGS DEBUG:', result);
    return result;
  }

  // ✅ MÉTODO CORREGIDO: Obtener nombre del rol para mostrar en UI
  getRoleDisplayName(): string {
    const role = this.getUserRole();
    console.log('🔍 GET ROLE DISPLAY NAME DEBUG - Role:', role);
    
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'Administrador';
      case USER_ROLES.LIBRARIAN:
        return 'Bibliotecario';
      case USER_ROLES.USER:
        return 'Usuario';
      default:
        console.log('🔍 ROLE NOT MATCHED - Returning Invitado for role:', role);
        return 'Invitado';
    }
  }

  // ✅ MÉTODO ADICIONAL: Verificar permisos específicos por acción
  hasPermission(action: string): boolean {
    const permissions = {
      'view-logs': this.canViewLogs(),
      'create-books': this.canCreateBooks(),
      'edit-books': this.canEditBooks(),
      'delete-books': this.canDeleteBooks(),
      'manage-loans': this.canManageLoans(),
      'view-all-loans': this.canViewAllLoans()
    };

    return permissions[action as keyof typeof permissions] || false;
  }
}