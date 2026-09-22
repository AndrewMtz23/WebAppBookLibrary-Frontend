import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PagedResult } from '../../shared/models/paged-result.model';
export interface CategoryRef { id: string; name: string; slug: string; isActive: boolean; }
export interface Category extends CategoryRef { description: string | null; version: number; createdAt: string; updatedAt: string; bookCount?: number; }
@Injectable({ providedIn: 'root' })
export class CategoriesApi {
  private readonly http = inject(HttpClient);
  list(query = '', page = 1, admin = false, isActive = '') {
    let params = new HttpParams().set('query', query).set('page', page).set('pageSize', 20);
    if (admin && isActive) params = params.set('isActive', isActive);
    return this.http.get<PagedResult<Category>>(admin ? '/api/admin/categories' : '/api/categories', { params });
  }
  create(body: { name: string; description: string | null }) { return this.http.post<Category>('/api/admin/categories', body); }
  update(id: string, body: { name: string; description: string | null; version: number }) { return this.http.put<Category>(`/api/admin/categories/${encodeURIComponent(id)}`, body); }
  status(category: Category) { return this.http.patch<Category>(`/api/admin/categories/${encodeURIComponent(category.id)}/status`, { isActive: !category.isActive, version: category.version }); }
  delete(category: Category) { return this.http.delete<void>(`/api/admin/categories/${encodeURIComponent(category.id)}`, { params: { version: category.version } }); }
}
