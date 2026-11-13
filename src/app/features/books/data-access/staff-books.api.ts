import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { switchMap } from 'rxjs';
import { BranchContextService } from '../../../core/branches/branch-context.service';
import { BookDetail, BookSummary } from '../../../shared/models/book.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { BookManagement, BookWriteRequest, StaffBookQuery } from './staff-books.models';

@Injectable({ providedIn: 'root' })
export class StaffBooksApi {
  private readonly http = inject(HttpClient);
  private readonly branches = inject(BranchContextService);
  search(query: StaffBookQuery) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) if (value !== '') params = params.set(key, value);
    return this.http.get<PagedResult<BookSummary>>('/api/books', { params });
  }
  management(id: string) { return this.http.get<BookManagement>(`/api/books/${encodeURIComponent(id)}/management`); }
  create(body: BookWriteRequest) { return this.http.post<BookDetail>('/api/books', body); }
  update(id: string, body: BookWriteRequest) { return this.http.put<BookDetail>(`/api/books/${encodeURIComponent(id)}`, body); }
  propose(id: string, body: BookWriteRequest) { return this.http.post<unknown>(`/api/book-change-requests/books/${encodeURIComponent(id)}`, body); }
  status(id: string, isActive: boolean) {
    const send = (expectedCatalogVersion?: number) => this.http.patch<unknown>(`/api/books/${encodeURIComponent(id)}/status`, { isActive, ...(expectedCatalogVersion === undefined ? {} : { expectedCatalogVersion }) });
    return this.branches.enabled() ? this.management(id).pipe(switchMap(record => send(record.catalogVersion))) : send();
  }
  permanent(id: string) { return this.http.delete<void>(`/api/books/${encodeURIComponent(id)}/permanent`); }
}
