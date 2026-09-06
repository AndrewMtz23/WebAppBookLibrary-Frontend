import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import { BookDetail } from '../../../../shared/models/book.model';
import { FavoritesFacade } from '../../../reader/data-access/favorites.facade';
import { ReservationsFacade } from '../../../reader/data-access/reservations.facade';
import { ReaderService } from '../../../reader/data-access/reader.service';
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
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let catalog: jasmine.SpyObj<CatalogService>;
  let reader: jasmine.SpyObj<ReaderService>;

  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({ bookId: 'book-1' }));
    catalog = jasmine.createSpyObj<CatalogService>('CatalogService', ['getById', 'search']);
    catalog.getById.and.callFake(id => of({ ...detail, id, title: id === 'book-1' ? detail.title : 'Nueva ficha' }));
    catalog.search.and.returnValue(of({ items: [{ ...detail, id: 'book-2', title: 'El llano en llamas' }], page: 1, pageSize: 5, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }));
    reader = jasmine.createSpyObj<ReaderService>('ReaderService', ['getLoans', 'getDigitalAccess']);
    reader.getLoans.and.returnValue(of({ items: [], page: 1, pageSize: 100, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false }));
    TestBed.configureTestingModule({ imports: [BookDetailPageComponent, NoopAnimationsModule], providers: [
      { provide: ActivatedRoute, useValue: { paramMap: params.asObservable() } },
      { provide: CatalogService, useValue: catalog },
      { provide: ReaderService, useValue: reader },
      { provide: ReservationsFacade, useValue: reservations },
      {
        provide: FavoritesFacade,
        useValue: {
          busyIds: () => new Set<string>(),
          isFavorite: () => false,
          isBusy: () => false,
          toggle: jasmine.createSpy('toggle')
        }
      }
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

  it('reloads the reused component when the related book id changes', () => {
    const fixture = TestBed.createComponent(BookDetailPageComponent);
    fixture.detectChanges();
    params.next(convertToParamMap({ bookId: 'book-2' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Nueva ficha');
    expect(catalog.getById).toHaveBeenCalledWith('book-2');
  });

  it('offers direct digital access when an active reservation already exists', () => {
    catalog.getById.and.returnValue(of({ ...detail, mediaType: 'digital', availableCopies: null, totalCopies: null }));
    reader.getLoans.and.returnValue(of({ items: [{ id: 'loan-1', bookId: 'book-1', userId: 'u', mediaType: 'digital', status: 'active', reservedAt: '2026-01-01', dueAt: null, returnedAt: null, cancelledAt: null, notes: null }], page: 1, pageSize: 100, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }));
    const fixture = TestBed.createComponent(BookDetailPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Abrir PDF');
    expect(fixture.nativeElement.textContent).not.toContain('Reservar acceso digital');
  });
});
