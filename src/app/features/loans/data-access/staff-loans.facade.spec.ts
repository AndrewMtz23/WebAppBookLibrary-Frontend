import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { StaffLoansFacade } from './staff-loans.facade';
import { StaffLoansApi } from './staff-loans.api';
import { StaffLoanDetail } from './staff-loans.models';
import { AuthService } from '../../../core/services/auth.service';

describe('StaffLoansFacade', () => {
  const detail: StaffLoanDetail = { loan: { id: 'a', bookId: 'b', userId: 'u', bookTitle: 'Libro A', username: 'ana', displayName: 'Ana', status: 'active', mediaType: 'physical', reservedAt: '2026-09-01T00:00:00Z', dueAt: '2026-09-15T00:00:00Z', returnedAt: null, cancelledAt: null, notes: null }, history: [], historyTruncated: false };
  const page = { items: [detail.loan], page: 3, pageSize: 20, totalItems: 41, totalPages: 3, hasPreviousPage: true, hasNextPage: false };
  let api: jasmine.SpyObj<StaffLoansApi>; let facade: StaffLoansFacade;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>; let role: string;
  beforeEach(() => {
    role = 'librarian';
    api = jasmine.createSpyObj('api', ['search', 'detail', 'complete']); api.search.and.returnValue(of(page)); api.detail.and.returnValue(of(detail)); api.complete.and.returnValue(of({ idempotent: false, message: '' }));
    params = new BehaviorSubject(convertToParamMap({ page: '3', query: 'ana', status: 'returned', dateField: 'returnedAt', from: '2026-09-01T00:00:00Z', sort: 'dueAt', direction: 'asc' }));
    TestBed.configureTestingModule({ providers: [StaffLoansFacade, { provide: StaffLoansApi, useValue: api }, { provide: ActivatedRoute, useValue: { queryParamMap: params } }, { provide: Router, useValue: { navigate: jasmine.createSpy().and.resolveTo(true) } }, { provide: AuthService, useValue: { getUserRole: () => role } }] });
    facade = TestBed.inject(StaffLoansFacade);
  });
  it('restores URL period/status and back-forward without full data downloads', () => {
    expect(facade.query()).toEqual(jasmine.objectContaining({ page: 3, query: 'ana', status: 'returned', dateField: 'returnedAt', sort: 'dueAt' }));
    params.next(convertToParamMap({ page: '2', status: 'cancelled', dateField: 'cancelledAt', dueTo: '2026-09-15T00:00:00Z', mediaType: 'digital' }));
    expect(api.search.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ page: 2, query: '', status: 'cancelled', dateField: 'cancelledAt', mediaType: 'digital' }));
  });
  it('resets page on filter changes and preserves page on refresh', () => {
    facade.filters({ status: 'overdue' }); expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: jasmine.objectContaining({ page: 1, status: 'overdue' }) }));
    facade.refresh(); expect(api.search.calls.mostRecent().args[0].page).toBe(3);
  });
  it('cancels superseded list requests and keeps refreshing state', () => {
    const pending = new Subject<typeof page>(); api.search.and.returnValue(pending); facade.refresh(); params.next(convertToParamMap({ page: 2 }));
    expect(facade.loading()).toBeTrue(); expect(facade.page()).toEqual(page);
  });
  it('guards double mutation and blocks switching or closing during command', () => {
    facade.open('a'); facade.request('return'); const response = new Subject<{ idempotent: boolean; message: string }>(); api.complete.and.returnValue(response);
    facade.confirm(); facade.confirm(); facade.open('b'); facade.close();
    expect(api.complete.calls.count()).toBe(1); expect(facade.selectedId()).toBe('a'); expect(facade.busy()).toBeTrue();
    response.next({ idempotent: true, message: '' }); response.complete();
    expect(facade.notice()).toContain('ya'); expect(api.search.calls.mostRecent().args[0].status).toBe('returned');
  });
  it('reconciles 409 while preserving filter and detail context', () => {
    facade.open('a'); facade.request('return'); api.complete.and.returnValue(throwError(() => ({ status: 409 })));
    api.detail.and.returnValue(of({ ...detail, loan: { ...detail.loan, status: 'cancelled' } })); facade.confirm();
    expect(facade.detail()?.loan.status).toBe('cancelled'); expect(facade.selectedId()).toBe('a'); expect(facade.notice()).toContain('cambió'); expect(facade.pending()).toBeNull();
    expect(facade.query().page).toBe(3); expect(facade.canAct('return')).toBeFalse();
  });
  it('never retries timed out mutation and requires fresh state before another action', () => {
    facade.open('a'); facade.request('cancel'); api.complete.and.returnValue(throwError(() => ({ status: 0 })));
    const reload = new Subject<StaffLoanDetail>(); api.detail.and.returnValue(reload); facade.confirm(); facade.request('cancel'); facade.confirm();
    expect(api.complete.calls.count()).toBe(1); expect(facade.notice()).toContain('confirmar'); expect(facade.canAct('cancel')).toBeFalse();
  });
  it('cancels A detail when B opens and on destruction', () => {
    const first = new Subject<StaffLoanDetail>(); api.detail.and.returnValue(first); facade.open('a');
    api.detail.and.returnValue(of({ ...detail, loan: { ...detail.loan, id: 'b' } })); facade.open('b'); first.next(detail);
    expect(first.observed).toBeFalse(); expect(facade.detail()?.loan.id).toBe('b');
    api.detail.and.returnValue(first); facade.open('a'); TestBed.resetTestingModule(); expect(first.observed).toBeFalse();
  });
  it('enforces staff-only actions and physical return, while allowing librarian cancellation', () => {
    facade.open('a'); expect(facade.canAct('cancel')).toBeTrue(); role = 'user'; expect(facade.canAct('cancel')).toBeFalse(); facade.request('cancel'); expect(facade.pending()).toBeNull();
    role = 'admin'; api.detail.and.returnValue(of({ ...detail, loan: { ...detail.loan, mediaType: 'digital' } })); facade.open('a');
    expect(facade.canAct('return')).toBeFalse(); expect(facade.canAct('cancel')).toBeTrue();
  });
});
