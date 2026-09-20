import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Subject, throwError } from 'rxjs';
import { ReaderService } from './reader.service';
import { ReservationsFacade } from './reservations.facade';
import { ApiError, toApiError } from '../../../core/http/api-error';
import { SessionScopeService } from '../../../core/auth/session-scope.service';

describe('ReservationsFacade', () => {
  let reader: jasmine.SpyObj<ReaderService>;
  let facade: ReservationsFacade;

  beforeEach(() => {
    reader = jasmine.createSpyObj<ReaderService>('ReaderService', ['reserve']);
    TestBed.configureTestingModule({ providers: [ReservationsFacade, { provide: ReaderService, useValue: reader }] });
    facade = TestBed.inject(ReservationsFacade);
  });

  it('prevents duplicate requests while a book is busy', () => {
    reader.reserve.and.returnValue(new Subject());
    facade.reserve('book-1');
    facade.reserve('book-1');
    expect(reader.reserve).toHaveBeenCalledTimes(1);
    expect(facade.isBusy('book-1')).toBeTrue();
  });

  it('ignores a previous account response without clearing the current request', () => {
    const previous = new Subject<any>();
    const current = new Subject<any>();
    reader.reserve.and.returnValues(previous, current);
    facade.reserve('book-1');
    TestBed.inject(SessionScopeService).invalidate();
    expect(facade.isBusy('book-1')).toBeFalse();
    facade.reserve('book-1');
    previous.next({});
    previous.complete();
    expect(facade.successfulBookId()).toBeNull();
    expect(facade.message()).toBeNull();
    expect(facade.isBusy('book-1')).toBeTrue();
    current.next({});
    current.complete();
    expect(facade.successfulBookId()).toBe('book-1');
    expect(facade.isBusy('book-1')).toBeFalse();
  });

  it('maps duplicate and unavailable domain errors to useful feedback', () => {
    reader.reserve.and.returnValue(throwError(() => problem('duplicate_active_reservation')));
    facade.reserve('book-1');
    expect(facade.message()?.toLowerCase()).toContain('ya tienes una reserva activa');

    reader.reserve.and.returnValue(throwError(() => problem('book_unavailable')));
    facade.reserve('book-2');
    expect(facade.message()).toContain('no tiene ejemplares disponibles');
  });

  it('does not retry a network timeout blindly', () => {
    reader.reserve.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    facade.reserve('book-1');
    expect(reader.reserve).toHaveBeenCalledTimes(1);
    expect(facade.message()?.toLowerCase()).toContain('confirma tu conexión');
  });

  function problem(code: string): ApiError {
    return toApiError(new HttpErrorResponse({ status: 409, error: { code } }));
  }
});
