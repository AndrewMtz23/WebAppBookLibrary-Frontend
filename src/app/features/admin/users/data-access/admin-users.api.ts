import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PagedResult } from '../../../../shared/models/paged-result.model';
import { AdminUser, AdminUserQuery, UpdateAdminUserRequest } from './admin-users.models';

@Injectable({ providedIn: 'root' })
export class AdminUsersApi {
  private readonly http = inject(HttpClient);

  search(query: AdminUserQuery) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) if (value !== '') params = params.set(key, value);
    return this.http.get<PagedResult<AdminUser>>('/api/admin/users', { params });
  }

  create(request: { username: string; displayName: string; email: string; password: string; role: AdminUser['role'] }) { return this.http.post<AdminUser>('/api/admin/users', request); }

  permanent(id: string) { return this.http.delete<void>(`/api/admin/users/${encodeURIComponent(id)}/permanent`); }
  detail(id: string) { return this.http.get<AdminUser>(`/api/admin/users/${encodeURIComponent(id)}`); }
  update(id: string, request: UpdateAdminUserRequest) { return this.http.put<AdminUser>(`/api/admin/users/${encodeURIComponent(id)}`, request); }
  setRole(id: string, role: AdminUser['role']) { return this.http.put<void>(`/api/admin/users/${encodeURIComponent(id)}/role`, { role }); }
  setStatus(id: string, isActive: boolean) { return this.http.put<void>(`/api/admin/users/${encodeURIComponent(id)}/status`, { isActive }); }
}
