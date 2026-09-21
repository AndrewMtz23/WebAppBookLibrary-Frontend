import { TestBed } from '@angular/core/testing';
import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { BookDetail } from '../../../../shared/models/book.model';
import { FavoritesFacade } from '../../../reader/data-access/favorites.facade';
import { ReservationsFacade } from '../../../reader/data-access/reservations.facade';
import { ReaderService } from '../../../reader/data-access/reader.service';
import { CatalogService } from '../../data-access/catalog.service';
import { BookDetailPageComponent } from './book-detail-page.component';
import { AuthService } from '../../../../core/services/auth.service';

describe('BookDetailPageComponent', () => {
  const detail: BookDetail = {
    id: 'book-1', title: 'Pedro Páramo', subtitle: null, authors: ['Juan Rulfo'], isbn: null,
    description: 'Una novela esencial.', publisher: null, publishedDate: null, language: 'es', pageCount: null,
    genres: ['Novela'], tags: [], coverUrl: null, mediaType: 'physical', availableCopies: 2, totalCopies: 3,
    reservationCount: 8, isFavorite: false, isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01'
  };
  const reservations = { reserve: jasmine.createSpy('reserve'), confirmed$: new Subject<string>(), resetFeedback: () => undefined, isBusy: () => false, message: () => null, successfulBookId: () => null };
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let catalog: jasmine.SpyObj<CatalogService>;
  let reader: jasmine.SpyObj<ReaderService>;

  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({ bookId: 'book-1' }));
    catalog = jasmine.createSpyObj<CatalogService>('CatalogService', ['getById', 'search']);
    catalog.getById.and.callFake(id => of({ ...detail, id, title: id === 'book-1' ? detail.title : 'Nueva ficha' }));
    catalog.search.and.returnValue(of({ items: [{ ...detail, id: 'book-2', title: 'El llano en llamas' }], page: 1, pageSize: 5, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }));
    reader = jasmine.createSpyObj<ReaderService>('ReaderService', ['getLoans', 'getDigitalAccess', 'reserve']);
    reader.getLoans.and.returnValue(of({ items: [], page: 1, pageSize: 100, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false }));
    TestBed.configureTestingModule({ imports: [BookDetailPageComponent, NoopAnimationsModule], providers: [
      { provide: ActivatedRoute, useValue: { paramMap: params.asObservable() } },
      { provide: CatalogService, useValue: catalog },
      { provide: ReaderService, useValue: reader },
      { provide: AuthService, useValue: { isLoggedIn: () => true, sessionSnapshot: { user: { role: 'user' } } } },
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

  it('renders a read-only catalog preview for staff without requesting reader state', () => {
    TestBed.overrideProvider(AuthService, { useValue: { isLoggedIn: () => true, sessionSnapshot: { user: { role: 'admin' } } } });
    const fixture = TestBed.createComponent(BookDetailPageComponent);
    fixture.detectChanges();

    expect(reader.getLoans).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Vista de catálogo');
    expect(fixture.nativeElement.textContent).not.toContain('Reservar ejemplar');
    expect(fixture.nativeElement.textContent).not.toContain('Guardar');
    expect(fixture.nativeElement.querySelector('button.favorite')).toBeNull();
  });

  it('keeps the calendar publication date in a negative timezone', () => {
    TestBed.configureTestingModule({ providers: [{ provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: '-0600' } }] });
    catalog.getById.and.returnValue(of({ ...detail, publishedDate: '1818-01-01T00:00:00Z' }));
    const fixture = TestBed.createComponent(BookDetailPageComponent);
    fixture.detectChanges();
    const date = Array.from(fixture.nativeElement.querySelectorAll('dl div') as NodeListOf<HTMLElement>).find(element => element.textContent?.includes('Publicación'))!;
    expect(date.textContent).toContain('1818');
    expect(date.textContent).not.toContain('1817');
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
    expect(fixture.nativeElement.textContent).toContain('Abrir recurso');
    expect(fixture.nativeElement.textContent).not.toContain('Reservar acceso digital');
  });

  it('refreshes physical inventory and prevents another reservation after confirmation', () => {
    TestBed.overrideProvider(ReservationsFacade, { useFactory: () => new ReservationsFacade() });
    const response = new Subject<import('../../../reader/models/reader.models').ReservationResponse>();
    reader.reserve.and.returnValue(response);
    const fixture = TestBed.createComponent(BookDetailPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.reserve(detail.id);
    catalog.getById.and.returnValue(of({ ...detail, availableCopies: 1, reservationCount: 9 }));
    const loan = { id: 'loan-1', bookId: detail.id, userId: 'u', mediaType: 'physical' as const, status: 'active' as const, reservedAt: '2026-09-08', dueAt: '2026-09-22', returnedAt: null, cancelledAt: null, notes: null };
    reader.getLoans.and.returnValue(of({ items: [loan], page: 1, pageSize: 1, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }));
    response.next({ message: 'Loan created successfully', data: loan });
    response.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 ejemplar disponible');
    expect(fixture.nativeElement.textContent).not.toContain('Reservar ejemplar');
    expect(fixture.nativeElement.textContent).toContain('Tu reserva quedó confirmada');
  });

  it('enables the digital resource immediately after reserving without a reload', () => {
    TestBed.overrideProvider(ReservationsFacade, { useFactory: () => new ReservationsFacade() });
    catalog.getById.and.returnValue(of({ ...detail, mediaType: 'digital', availableCopies: null, totalCopies: null }));
    const response = new Subject<import('../../../reader/models/reader.models').ReservationResponse>();
    reader.reserve.and.returnValue(response);
    const fixture = TestBed.createComponent(BookDetailPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.reserve(detail.id);
    const loan = { id: 'loan-1', bookId: detail.id, userId: 'u', mediaType: 'digital' as const, status: 'active' as const, reservedAt: '2026-09-08', dueAt: null, returnedAt: null, cancelledAt: null, notes: null };
    reader.getLoans.and.returnValue(of({ items: [loan], page: 1, pageSize: 1, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }));
    response.next({ message: 'Loan created successfully', data: loan });
    response.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Abrir recurso');
    expect(fixture.nativeElement.textContent).not.toContain('Reservar acceso digital');
  });

  it('ignores a stale empty reservation response after a successful digital reservation', () => {
    TestBed.overrideProvider(ReservationsFacade, { useFactory: () => new ReservationsFacade() });
    catalog.getById.and.returnValue(of({ ...detail, mediaType: 'digital', availableCopies: null, totalCopies: null }));
    const oldState = new Subject<import('../../../../shared/models/paged-result.model').PagedResult<import('../../../../shared/models/loan.model').LoanSummary>>();
    reader.getLoans.and.returnValue(oldState);
    const fixture = TestBed.createComponent(BookDetailPageComponent);
    fixture.detectChanges();
    const loan = { id: 'loan-1', bookId: detail.id, userId: 'u', mediaType: 'digital' as const, status: 'active' as const, reservedAt: '2026-09-08', dueAt: null, returnedAt: null, cancelledAt: null, notes: null };
    reader.getLoans.and.returnValue(of({ items: [loan], page: 1, pageSize: 1, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }));
    reader.reserve.and.returnValue(of({ message: 'Created', data: loan }));
    fixture.componentInstance.reserve(detail.id);
    oldState.next({ items: [], page: 1, pageSize: 1, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Abrir recurso');
    expect(fixture.nativeElement.textContent).not.toContain('Reservar acceso digital');
  });
});
