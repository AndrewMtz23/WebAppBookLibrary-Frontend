import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { StaffLoansApi } from './staff-loans.api';
import { DEFAULT_STAFF_LOAN_QUERY } from './staff-loans.models';
describe('StaffLoansApi', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('sends bounded server query including due interval, identity, period and ordering', () => {
    TestBed.inject(StaffLoansApi).search({ ...DEFAULT_STAFF_LOAN_QUERY, query: 'Ana', status: 'returned', userId: 'u', bookId: 'b', from: '2026-09-01T00:00:00Z', to: '2026-10-01T00:00:00Z', dueFrom: '2026-09-02T00:00:00Z', dueTo: '2026-09-05T00:00:00Z', dateField: 'returnedAt', sort: 'dueAt', direction: 'asc', page: 2, pageSize: 10 }).subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne(r => r.url === '/api/loans');
    expect(req.request.params.get('dateField')).toBe('returnedAt'); expect(req.request.params.get('page')).toBe('2'); expect(req.request.params.get('dueTo')).toBe('2026-09-05T00:00:00Z'); expect(req.request.params.get('userId')).toBe('u'); expect(req.request.params.has('mediaType')).toBeFalse(); req.flush({ items: [] });
  });
  it('uses detail and explicit single mutation endpoints', () => {
    const api = TestBed.inject(StaffLoansApi); const http = TestBed.inject(HttpTestingController);
    api.detail('abc').subscribe(); http.expectOne('/api/loans/abc').flush({});
    api.complete('abc', 'cancel').subscribe(); const request = http.expectOne('/api/loans/abc/cancel'); expect(request.request.method).toBe('PUT'); request.flush({ idempotent: true });
  });
});
