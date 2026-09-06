import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReaderService } from './reader.service';

describe('ReaderService', () => {
  let service: ReaderService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReaderService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the reader loan and protected digital endpoints', () => {
    service.getLoans({ status: 'active', page: 2, pageSize: 10 }).subscribe();
    service.reserve('book-1').subscribe();
    service.getDigitalAccess('book-1').subscribe();

    const loans = http.expectOne(request => request.url === '/api/loans/my');
    expect(loans.request.params.get('status')).toBe('active');
    expect(loans.request.params.get('page')).toBe('2');
    loans.flush({ items: [], page: 2, pageSize: 10, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: true });
    const reserve = http.expectOne('/api/loans');
    expect(reserve.request.method).toBe('POST');
    expect(reserve.request.body).toEqual({ bookId: 'book-1' });
    reserve.flush({ message: 'created', data: {} });
    http.expectOne('/api/books/book-1/digital-access').flush({ resourceUrl: 'https://example.com/book.pdf' });
  });

  it('uses direct favorite, dashboard and profile contracts', () => {
    service.getFavorites(1, 12).subscribe();
    service.addFavorite('book-1').subscribe();
    service.removeFavorite('book-1').subscribe();
    service.getDashboard().subscribe();
    service.getProfile().subscribe();

    http.expectOne(request => request.url === '/api/favorites' && request.params.get('pageSize') === '12').flush({ items: [] });
    const add = http.expectOne(request => request.url === '/api/favorites/book-1' && request.method === 'POST');
    expect(add.request.body).toEqual({});
    add.flush({ id: 'favorite-1', bookId: 'book-1', createdAt: '2026-09-06T00:00:00Z' });
    const remove = http.expectOne(request => request.url === '/api/favorites/book-1' && request.method === 'DELETE');
    remove.flush(null);
    const dashboard = http.expectOne(request => request.url === '/api/dashboard/reader');
    expect(dashboard.request.params.has('timezone')).toBeTrue();
    dashboard.flush({});
    const profile = http.expectOne('/api/profile/me');
    expect(profile.request.method).toBe('GET');
    profile.flush({});
  });
});
