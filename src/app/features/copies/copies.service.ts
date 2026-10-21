import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { CopyHistory, CopyInspection, CopyPage, CopyResponse, CopyStatus } from './copies.models';
@Injectable({ providedIn: 'root' })
export class CopiesService {
  private readonly http = inject(HttpClient);
  list(bookId: string, status = '', page = 1) { return this.http.get<CopyPage>(`/api/books/${encodeURIComponent(bookId)}/copies`, { params: { status, page, pageSize: 20 } }).pipe(timeout(20000)); }
  get(id: string) { return this.http.get<CopyResponse>(`/api/copies/${encodeURIComponent(id)}`).pipe(timeout(20000)); }
  lookup(code: string) { return this.http.get<CopyResponse>('/api/copies/lookup', { params: { code } }).pipe(timeout(20000)); }
  history(id: string, page = 1) { return this.http.get<{ items: CopyHistory[]; totalCount: number }>(`/api/copies/${encodeURIComponent(id)}/history`, { params: { page, pageSize: 20 } }).pipe(timeout(20000)); }
  create(bookId: string, request: CopyInspection & { inventoryCode: string; idempotencyKey: string }) { return this.http.post<CopyResponse>(`/api/books/${encodeURIComponent(bookId)}/copies`, request).pipe(timeout(20000)); }
  update(id: string, request: { expectedVersion: number; location: string | null; notes: string | null }) { return this.http.put<CopyResponse>(`/api/copies/${encodeURIComponent(id)}`, request).pipe(timeout(20000)); }
  inspect(id: string, request: { expectedVersion: number; inspection: CopyInspection }) { return this.http.put<CopyResponse>(`/api/copies/${encodeURIComponent(id)}/inspection`, request).pipe(timeout(20000)); }
  changeStatus(id: string, request: { status: CopyStatus; reason: string; expectedVersion: number; idempotencyKey: string }) { return this.http.put<CopyResponse>(`/api/copies/${encodeURIComponent(id)}/status`, request).pipe(timeout(20000)); }
}
