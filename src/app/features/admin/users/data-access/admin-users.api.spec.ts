import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AdminUsersApi } from './admin-users.api';
import { DEFAULT_ADMIN_USER_QUERY } from './admin-users.models';

describe('AdminUsersApi', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('sends search, role, status, date, sort and paging to the server', () => {
    TestBed.inject(AdminUsersApi).search({ ...DEFAULT_ADMIN_USER_QUERY, query: 'Ana', role: 'librarian', isActive: 'true', createdFrom: '2026-01-01T00:00:00Z', lastLoginTo: '2026-02-01T00:00:00Z', sort: 'role', direction: 'desc', page: 3, pageSize: 50 }).subscribe();
    const request = TestBed.inject(HttpTestingController).expectOne(item => item.url === '/api/admin/users');
    expect(request.request.params.get('role')).toBe('librarian');
    expect(request.request.params.get('createdFrom')).toBe('2026-01-01T00:00:00Z');
    expect(request.request.params.get('page')).toBe('3');
    expect(request.request.params.has('createdTo')).toBeFalse();
    request.flush({ items: [] });
  });

  it('uses safe detail and explicit role and status endpoints', () => {
    const api = TestBed.inject(AdminUsersApi); const http = TestBed.inject(HttpTestingController);
    api.detail('abc/def').subscribe(); http.expectOne('/api/admin/users/abc%2Fdef').flush({});
    api.setRole('abc', 'admin').subscribe(); const role = http.expectOne('/api/admin/users/abc/role'); expect(role.request.method).toBe('PUT'); expect(role.request.body).toEqual({ role: 'admin' }); role.flush(null);
    api.setStatus('abc', false).subscribe(); const status = http.expectOne('/api/admin/users/abc/status'); expect(status.request.body).toEqual({ isActive: false }); status.flush(null);
  });
});
