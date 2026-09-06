import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Subject, of, throwError } from 'rxjs';
import { CatalogService } from '../../../catalog/data-access/catalog.service';
import { ReaderService } from '../../data-access/reader.service';
import { MyLibraryFacade } from '../../data-access/my-library.facade';
import { MyLibraryPageComponent } from './my-library-page.component';

describe('MyLibraryPageComponent', () => {
  let reader: jasmine.SpyObj<ReaderService>;
  let openSpy: jasmine.Spy;

  beforeEach(() => {
    reader = jasmine.createSpyObj<ReaderService>('ReaderService', ['getLoans', 'getDigitalAccess', 'returnLoan', 'cancelLoan']);
    reader.getLoans.and.returnValue(of({ items: [], page: 1, pageSize: 100, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false }));
    openSpy = spyOn(window, 'open');
    TestBed.configureTestingModule({ imports: [MyLibraryPageComponent, NoopAnimationsModule], providers: [
      MyLibraryFacade,
      { provide: ReaderService, useValue: reader },
      { provide: CatalogService, useValue: { getById: () => of({ id: 'book-1', title: 'Libro de prueba', coverUrl: null }) } }
    ] });
  });

  it('opens only https digital resources in a protected new tab', () => {
    reader.getDigitalAccess.and.returnValue(of({ resourceUrl: 'https://library.example/read/1' }));
    const facade = TestBed.inject(MyLibraryFacade);
    facade.openDigital('book-1');
    expect(openSpy).toHaveBeenCalledWith('https://library.example/read/1', '_blank', 'noopener,noreferrer');

    reader.getDigitalAccess.and.returnValue(of({ resourceUrl: 'http://unsafe.example/read/1' }));
    facade.openDigital('book-2');
    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it('explains forbidden digital access', () => {
    reader.getDigitalAccess.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    const facade = TestBed.inject(MyLibraryFacade);
    facade.openDigital('book-1');
    expect(facade.message()).toContain('ya no está autorizado');
  });

  it('renders all four library sections', () => {
    const fixture = TestBed.createComponent(MyLibraryPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Activos');
    expect(fixture.nativeElement.textContent).toContain('Por vencer');
    expect(fixture.nativeElement.textContent).toContain('Vencidos');
    expect(fixture.nativeElement.textContent).toContain('Historial');
  });

  it('keeps a pending item visible and reconciles a 409 from the server', () => {
    const loan = { id: 'loan-1', bookId: 'book-1', userId: 'user-1', mediaType: 'physical' as const, status: 'active' as const, reservedAt: '2026-09-01T00:00:00Z', dueAt: '2099-09-10T00:00:00Z', returnedAt: null, cancelledAt: null, notes: null };
    reader.getLoans.and.returnValue(of({ items: [loan], page: 1, pageSize: 100, totalItems: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }));
    const response = new Subject<never>();
    reader.cancelLoan.and.returnValue(response);
    const facade = TestBed.inject(MyLibraryFacade);

    facade.cancelLoan('loan-1');
    expect(facade.loans().length).toBe(1);
    response.error(new HttpErrorResponse({ status: 409 }));
    expect(reader.getLoans).toHaveBeenCalledTimes(2);
  });

  it('loads every server page instead of truncating history at 100 items', () => {
    const first = { id: 'loan-1', bookId: 'book-1', userId: 'u', mediaType: 'digital' as const, status: 'returned' as const, reservedAt: '2026-01-01', dueAt: null, returnedAt: '2026-01-02', cancelledAt: null, notes: null };
    const second = { ...first, id: 'loan-2' };
    reader.getLoans.and.returnValues(
      of({ items: [first], page: 1, pageSize: 100, totalItems: 101, totalPages: 2, hasNextPage: true, hasPreviousPage: false }),
      of({ items: [second], page: 2, pageSize: 100, totalItems: 101, totalPages: 2, hasNextPage: false, hasPreviousPage: true })
    );
    const facade = TestBed.inject(MyLibraryFacade);
    expect(reader.getLoans.calls.allArgs().map(args => args[0]?.page)).toEqual([1, 2]);
    expect(facade.loans().map(item => item.id)).toEqual(['loan-1', 'loan-2']);
  });
});
