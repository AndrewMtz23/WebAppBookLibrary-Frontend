import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BookDetail, BookSummary } from '../../../shared/models/book.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { BookManagement, BookWriteRequest, StaffBookQuery } from './staff-books.models';

@Injectable({ providedIn: 'root' })
export class StaffBooksApi {
  private readonly http = inject(HttpClient);
  search(query: StaffBookQuery) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) if (value !== '') params = params.set(key, value);
    return this.http.get<PagedResult<BookSummary>>('/api/books', { params });
  }
  management(id: string) { return this.http.get<BookManagement>(`/api/books/${encodeURIComponent(id)}/management`); }
  create(body: BookWriteRequest) { return this.http.post<BookDetail>('/api/books', body); }
  update(id: string, body: BookWriteRequest) { return this.http.put<BookDetail>(`/api/books/${encodeURIComponent(id)}`, body); }
  status(id: string, isActive: boolean) { return this.http.patch<unknown>(`/api/books/${encodeURIComponent(id)}/status`, { isActive }); }
  permanent(id: string) { return this.http.delete<void>(`/api/books/${encodeURIComponent(id)}/permanent`); }
}
