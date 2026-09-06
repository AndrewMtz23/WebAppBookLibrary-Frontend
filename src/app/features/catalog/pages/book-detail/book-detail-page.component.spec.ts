import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { BookDetail } from '../../../../shared/models/book.model';
import { FavoritesFacade } from '../../../reader/data-access/favorites.facade';
import { ReservationsFacade } from '../../../reader/data-access/reservations.facade';
import { CatalogService } from '../../data-access/catalog.service';
import { BookDetailPageComponent } from './book-detail-page.component';

describe('BookDetailPageComponent', () => {
  const detail: BookDetail = {
    id: 'book-1', title: 'Pedro Páramo', subtitle: null, authors: ['Juan Rulfo'], isbn: null,
    description: 'Una novela esencial.', publisher: null, publishedDate: null, language: 'es', pageCount: null,
    genres: ['Novela'], tags: [], coverUrl: null, mediaType: 'physical', availableCopies: 2, totalCopies: 3,
    reservationCount: 8, isFavorite: false, isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01'
  };
  const reservations = { reserve: jasmine.createSpy('reserve'), isBusy: () => false, message: () => null, successfulBookId: () => null };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BookDetailPageComponent, NoopAnimationsModule], providers: [
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ bookId: 'book-1' })) } },
      { provide: CatalogService, useValue: { getById: () => of(detail), search: () => of({ items: [{ ...detail, id: 'book-2', title: 'El llano en llamas' }], page: 1, pageSize: 5, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }) } },
      { provide: ReservationsFacade, useValue: reservations },
      { provide: FavoritesFacade, useValue: { isFavorite: () => false, isBusy: () => false, toggle: jasmine.createSpy('toggle') } }
    ] });
  });

  it('renders one h1, omits absent metadata and offers the physical reservation action', () => {
    const fixture = TestBed.createComponent(BookDetailPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Reservar ejemplar');
    expect(fixture.nativeElement.textContent).not.toContain('ISBN');
    expect(fixture.nativeElement.textContent).toContain('El llano en llamas');
  });
});
