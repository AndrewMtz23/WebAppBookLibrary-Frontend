import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CatalogService } from '../catalog/data-access/catalog.service';
import { CatalogPageComponent } from '../catalog/pages/catalog/catalog-page.component';
import { ReaderService } from './data-access/reader.service';
import { MyLibraryPageComponent } from './pages/my-library/my-library-page.component';
import { READER_ROUTES } from './reader.routes';
import { LoanSummary } from '../../shared/models/loan.model';
import { BookDetail } from '../../shared/models/book.model';
import { AuthService } from '../../core/services/auth.service';
import { ProfilePageComponent } from './pages/profile/profile-page.component';
import { DiscoverPageComponent } from './pages/discover/discover-page.component';

@Component({ standalone: true, template: 'Otra página' })
class OtherPage {}

describe('reader route lifecycle', () => {
  const book: BookDetail = { id: 'book-1', title: 'Frankenstein', subtitle: null, authors: ['Mary Shelley'], isbn: null, description: 'Novela', publisher: null, publishedDate: null, language: 'es', pageCount: null, genres: [], tags: [], coverUrl: null, mediaType: 'digital', availableCopies: null, totalCopies: null, reservationCount: 0, isFavorite: false, isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
  let loans: LoanSummary[];
  let catalog: jasmine.SpyObj<CatalogService>;

  beforeEach(() => {
    loans = [];
    catalog = jasmine.createSpyObj<CatalogService>('catalog', ['search', 'getById', 'getFacets']);
    catalog.search.and.returnValue(of({ items: [book], page: 1, pageSize: 20, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }));
    catalog.getById.and.returnValue(of(book));
    catalog.getFacets.and.returnValue(of([]));
    TestBed.configureTestingModule({ imports: [NoopAnimationsModule], providers: [
      provideRouter([...READER_ROUTES[0].children!.filter(route => ['catalog', 'my-library', 'profile', 'discover'].includes(route.path!)), { path: 'other', component: OtherPage }]),
      { provide: CatalogService, useValue: catalog },
      { provide: AuthService, useValue: { sessionSnapshot: { user: { username: 'reader', role: 'user' } } } },
      { provide: ReaderService, useValue: {
        getLoans: () => of({ items: [...loans], page: 1, pageSize: 100, totalItems: loans.length, totalPages: loans.length ? 1 : 0, hasNextPage: false, hasPreviousPage: false }),
        getProfile: () => of({ id: 'reader', username: 'reader', displayName: 'Lector', email: 'reader@example.com', role: 'user', createdAt: '2026-01-01', lastLoginAt: null }),
        getFavorites: () => of({ items: [], page: 1, pageSize: 1, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false }),
        getDashboard: () => of({ generatedAt: '2026-09-08', from: '2026-09-01', to: '2026-09-09', totalReservations: loans.length, favorites: 0, byMedia: [] })
      } }
    ] });
  });

  it('reloads current loans when returning after a reservation elsewhere', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/my-library', MyLibraryPageComponent);
    expect(harness.routeNativeElement!.textContent).not.toContain('Frankenstein');
    await harness.navigateByUrl('/other');
    loans = [{ id: 'loan-1', bookId: book.id, userId: 'reader', mediaType: 'digital', status: 'active', reservedAt: '2026-09-08', dueAt: null, returnedAt: null, cancelledAt: null, notes: null }];
    await harness.navigateByUrl('/my-library', MyLibraryPageComponent);
    expect(harness.routeNativeElement!.textContent).toContain('Frankenstein');
    expect(harness.routeNativeElement!.textContent).toContain('Abrir recurso');
  });

  it('reads the current catalog query after leaving and returning', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/catalog?query=Frankenstein&sort=relevance', CatalogPageComponent);
    expect(catalog.search.calls.mostRecent().args[0].query).toBe('Frankenstein');
    await harness.navigateByUrl('/other');
    await harness.navigateByUrl('/catalog?query=Kafka&sort=relevance', CatalogPageComponent);
    expect(catalog.search.calls.mostRecent().args[0].query).toBe('Kafka');
  });

  for (const path of ['profile', 'discover'] as const) {
    it(`refreshes ${path} metrics after activity on another page`, async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/' + path);
      await harness.navigateByUrl('/other');
      loans = [{ id: 'loan-1', bookId: book.id, userId: 'reader', mediaType: 'digital', status: 'active', reservedAt: '2026-09-08', dueAt: null, returnedAt: null, cancelledAt: null, notes: null }];
      if (path === 'profile') {
        const page = await harness.navigateByUrl('/profile', ProfilePageComponent);
        expect(page.facade.activeReservations().data).toBe(1);
      } else {
        const page = await harness.navigateByUrl('/discover', DiscoverPageComponent);
        expect(page.facade.activity().data?.totalReservations).toBe(1);
        expect(harness.routeNativeElement!.textContent).toContain('Frankenstein');
      }
    });
  }
});
