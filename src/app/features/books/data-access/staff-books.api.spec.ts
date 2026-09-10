import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StaffBooksApi } from './staff-books.api';
import { DEFAULT_STAFF_BOOK_QUERY } from './staff-books.models';

describe('StaffBooksApi', () => {
  let api: StaffBooksApi; let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }); api = TestBed.inject(StaffBooksApi); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('sends all staff filters and server pagination without losing false', () => {
    api.search({ ...DEFAULT_STAFF_BOOK_QUERY, page: 4, genre: 'Historia', mediaType: 'digital', language: 'es', available: 'false', isActive: 'false', lowStock: 'true', missingResource: 'true' }).subscribe();
    const request = http.expectOne(r => r.url === '/api/books');
    for (const [key, value] of Object.entries({ page: '4', genre: 'Historia', mediaType: 'digital', language: 'es', available: 'false', isActive: 'false', lowStock: 'true', missingResource: 'true' })) expect(request.request.params.get(key)).toBe(value);
    request.flush({ items: [], totalItems: 0 });
  });
  it('uses protected management and distinct status/permanent commands', () => {
    api.management('abc').subscribe(); http.expectOne('/api/books/abc/management').flush({});
    api.status('abc', false).subscribe(); const status = http.expectOne('/api/books/abc/status'); expect(status.request.method).toBe('PATCH'); expect(status.request.body).toEqual({ isActive: false }); status.flush({});
    api.permanent('abc').subscribe(); const deletion = http.expectOne('/api/books/abc/permanent'); expect(deletion.request.method).toBe('DELETE'); deletion.flush(null);
  });
});
