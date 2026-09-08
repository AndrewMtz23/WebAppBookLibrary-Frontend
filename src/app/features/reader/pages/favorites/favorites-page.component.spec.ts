import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';
import { BookDetail } from '../../../../shared/models/book.model';
import { CatalogService } from '../../../catalog/data-access/catalog.service';
import { FavoritesFacade } from '../../data-access/favorites.facade';
import { ReaderService } from '../../data-access/reader.service';
import { FavoritesPageComponent } from './favorites-page.component';

describe('FavoritesPageComponent', () => {
  let reader: jasmine.SpyObj<ReaderService>;
  let catalog: jasmine.SpyObj<CatalogService>;

  beforeEach(() => {
    reader = jasmine.createSpyObj<ReaderService>('ReaderService', ['getFavorites', 'removeFavorite', 'addFavorite']);
    catalog = jasmine.createSpyObj<CatalogService>('CatalogService', ['getById']);
    reader.getFavorites.and.returnValue(of({ items: [
      { id: 'fav-1', bookId: 'book-1', createdAt: '2026-08-02T00:00:00Z' },
      { id: 'fav-2', bookId: 'book-2', createdAt: '2026-08-01T00:00:00Z' }
    ], page: 1, pageSize: 20, totalItems: 2, totalPages: 1, hasNextPage: false, hasPreviousPage: false }));
    catalog.getById.and.callFake(id => of(book(id, id === 'book-1')));
    TestBed.configureTestingModule({ imports: [FavoritesPageComponent, NoopAnimationsModule], providers: [
      FavoritesFacade,
      provideRouter([]),
      { provide: ReaderService, useValue: reader },
      { provide: CatalogService, useValue: catalog }
    ] });
  });

  it('loads favorites, hides inactive books and preserves favorite dates', () => {
    const fixture = TestBed.createComponent(FavoritesPageComponent);
    fixture.detectChanges();
    const facade = TestBed.inject(FavoritesFacade);
    expect(facade.items().length).toBe(1);
    expect(facade.items()[0].createdAt).toBe('2026-08-02T00:00:00Z');
    expect(fixture.nativeElement.textContent).toContain('Título book-1');
    expect(fixture.nativeElement.textContent).not.toContain('Título book-2');
  });

  it('removes optimistically and reinserts at the same position on failure', () => {
    const response = new Subject<never>();
    reader.removeFavorite.and.returnValue(response);
    TestBed.createComponent(FavoritesPageComponent).detectChanges();
    const facade = TestBed.inject(FavoritesFacade);
    const original = facade.items()[0];
    facade.remove(original.book);
    expect(facade.items()).toEqual([]);
    response.error(new Error('offline'));
    expect(facade.items()[0]).toEqual(original);
  });

  function book(id: string, active: boolean): BookDetail {
    return { id, title: `Título ${id}`, subtitle: null, authors: ['Autora'], isbn: null, description: '', publisher: null, publishedDate: null, language: 'es', pageCount: null, genres: ['Novela'], tags: [], coverUrl: null, mediaType: 'physical', availableCopies: 1, totalCopies: 1, reservationCount: 0, isFavorite: true, isActive: active, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
  }
});
