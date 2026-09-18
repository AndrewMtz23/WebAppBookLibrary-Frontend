import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { PagedResult } from '../../../../shared/models/paged-result.model';
import { AdminUsersApi } from './admin-users.api';
import { AdminUsersFacade } from './admin-users.facade';
import { AdminUser } from './admin-users.models';

describe('AdminUsersFacade', () => {
  const user: AdminUser = { id: 'target', username: 'ana', displayName: 'Ana', email: 'ana@example.test', role: 'user', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', lastLoginAt: null };
  const page: PagedResult<AdminUser> = { items: [user], page: 3, pageSize: 20, totalItems: 41, totalPages: 3, hasPreviousPage: true, hasNextPage: false };
  let api: jasmine.SpyObj<AdminUsersApi>; let facade: AdminUsersFacade; let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } }] });
    api = jasmine.createSpyObj('api', ['search', 'detail', 'update', 'setRole', 'setStatus', 'permanent']);
    api.search.and.returnValue(of(page)); api.detail.and.returnValue(of(user)); api.update.and.returnValue(of(user)); api.setRole.and.returnValue(of(void 0)); api.setStatus.and.returnValue(of(void 0));
    params = new BehaviorSubject(convertToParamMap({ query: 'ana', role: 'user', isActive: 'true', sort: 'createdAt', direction: 'desc', page: '3' }));
    TestBed.configureTestingModule({ providers: [AdminUsersFacade, { provide: AdminUsersApi, useValue: api }, { provide: ActivatedRoute, useValue: { queryParamMap: params } }, { provide: Router, useValue: { navigate: jasmine.createSpy().and.resolveTo(true) } }, { provide: AuthService, useValue: { getUserId: () => 'self' } }] });
    facade = TestBed.inject(AdminUsersFacade);
  });

  it('updates the selected user as one command and refreshes the list', () => {
    facade.open(user.id);
    const request = { username: 'ana', displayName: 'Ana Editada', email: 'ana@example.test', avatarUrl: 'https://images.example.test/ana.jpg', role: 'librarian' as const, isActive: true, expectedUpdatedAt: user.updatedAt };
    const updated = { ...user, ...request, updatedAt: '2026-01-02T00:00:00Z' };
    api.update.and.returnValue(of(updated));
    facade.save(user, request);

    expect(api.update).toHaveBeenCalledOnceWith('target', request);
    expect(facade.selectedId()).toBeNull();
    expect(facade.detail()).toBeNull();
    expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalledWith(jasmine.stringMatching('Usuario actualizado'), 'Cerrar', jasmine.any(Object));
    expect(facade.notice()).toContain('Usuario actualizado');
    expect(api.search.calls.count()).toBe(2);
  });

  it('restores URL filters and cancels a superseded list request', () => {
    expect(facade.query()).toEqual(jasmine.objectContaining({ query: 'ana', role: 'user', isActive: 'true', page: 3 }));
    const stale = new Subject<PagedResult<AdminUser>>(); api.search.and.returnValue(stale); facade.refresh();
    api.search.and.returnValue(of({ ...page, page: 2, items: [] })); params.next(convertToParamMap({ role: 'admin', page: '2' })); stale.next(page);
    expect(stale.observed).toBeFalse(); expect(facade.page()?.page).toBe(2); expect(facade.query().role).toBe('admin');
  });

  for (const status of [0, 400, 403, 409, 500]) {
    it(`keeps the user editor open and reports a failed save (${status})`, () => {
      facade.open(user.id);
      api.update.and.returnValue(throwError(() => ({ status })));
      facade.save(user, { ...user, avatarUrl: null, expectedUpdatedAt: user.updatedAt });
      expect(facade.selectedId()).toBe(user.id);
      expect(facade.detail()).toEqual(user);
      expect(facade.busy()).toBeFalse();
      expect(facade.editorError()).not.toBe('');
      expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalledWith(facade.editorError(), 'Cerrar', jasmine.any(Object));
    });
  }

  it('blocks self-demotion and self-deactivation in the behavior layer', () => {
    const self = { ...user, id: 'self', role: 'admin' as const };
    facade.requestRole(self, 'librarian'); expect(facade.pending()).toBeNull();
    facade.requestStatus(self); expect(facade.pending()).toBeNull();
  });

  it('blocks permanent deletion of self and active accounts', () => {
    facade.requestPermanent(user); expect(facade.pending()).toBeNull();
    facade.requestPermanent({ ...user, id: 'self', isActive: false }); expect(facade.pending()).toBeNull();
    expect(api.permanent).not.toHaveBeenCalled();
  });

  it('keeps a deletion conflict visible after refreshing the list', () => {
    api.permanent.and.returnValue(throwError(() => ({ status: 409 })));
    facade.requestPermanent({ ...user, isActive: false }); facade.confirm();
    expect(facade.pending()).toBeNull();
    expect(facade.error()).toContain('historial');
    expect(api.search.calls.count()).toBe(2);
    expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalledOnceWith(jasmine.stringMatching('historial'), 'Cerrar', jasmine.any(Object));
  });

  it('syncs the current account before closing its editor', () => {
    const auth = TestBed.inject(AuthService);
    const sync = jasmine.createSpy('syncCurrentUser');
    auth.syncCurrentUser = sync;
    const self = { ...user, id: 'self', role: 'admin' as const };
    api.detail.and.returnValue(of(self));
    api.update.and.returnValue(of({ ...self, email: 'new@example.test' }));
    facade.open(self.id);
    facade.save(self, { ...self, email: 'new@example.test', avatarUrl: null, expectedUpdatedAt: self.updatedAt });
    expect(sync).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'self', email: 'new@example.test' }));
    expect(facade.selectedId()).toBeNull();
  });

  for (const active of [true, false]) {
    it(`reports a successful account status change from ${active}`, () => {
      facade.requestStatus({ ...user, isActive: active }); facade.confirm();
      expect(facade.pending()).toBeNull();
      expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalledWith(
        active ? 'Cuenta desactivada y acceso retirado.' : 'Cuenta activada.', 'Cerrar', jasmine.any(Object));
    });
  }

  it('refreshes the current row and list after a successful role mutation', () => {
    facade.open(user.id); facade.requestRole(user, 'librarian'); facade.confirm();
    expect(api.setRole).toHaveBeenCalledOnceWith('target', 'librarian');
    expect(api.detail.calls.count()).toBe(2); expect(api.search.calls.count()).toBe(2);
    expect(facade.pending()).toBeNull(); expect(facade.notice()).toContain('sesión anterior');
    expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalledWith(facade.notice(), 'Cerrar', jasmine.any(Object));
  });

  it('keeps the exact pending choice and refetches current state after 409', () => {
    api.setStatus.and.returnValue(throwError(() => ({ status: 409 })));
    api.detail.and.returnValue(of({ ...user, role: 'librarian', isActive: false }));
    facade.requestStatus(user); facade.confirm();
    expect(facade.pending()).toEqual(jasmine.objectContaining({ type: 'status', nextActive: false }));
    expect(facade.pending()?.user).toEqual(jasmine.objectContaining({ role: 'librarian', isActive: false }));
    expect(facade.selectedId()).toBe('target'); expect(api.detail).toHaveBeenCalledWith('target'); expect(api.search.calls.count()).toBe(2);
    expect(facade.notice()).toContain('Conservamos tu selección');
  });

  it('gates reconfirmation until a delayed 409 reconciliation succeeds', () => {
    const detail = new Subject<AdminUser>();
    api.setStatus.and.returnValue(throwError(() => ({ status: 409 })));
    api.detail.and.returnValue(detail);
    facade.requestStatus(user); facade.confirm();

    expect(facade.reconciling()).toBeTrue();
    facade.confirm();
    expect(api.setStatus).toHaveBeenCalledTimes(1);

    detail.next({ ...user, role: 'librarian', isActive: false });
    detail.complete();
    expect(facade.reconciling()).toBeFalse();
    expect(facade.pending()?.user).toEqual(jasmine.objectContaining({ role: 'librarian', isActive: false }));
  });

  it('keeps a 409 pending after reconciliation failure and retries before reconfirmation', () => {
    const failed = new Subject<AdminUser>();
    api.setStatus.and.returnValue(throwError(() => ({ status: 409 })));
    api.detail.and.returnValue(failed);
    facade.requestStatus(user); facade.confirm();
    failed.error({ status: 503 });

    expect(facade.reconciliationError()).toContain('No pudimos consultar');
    facade.confirm();
    expect(api.setStatus).toHaveBeenCalledTimes(1);

    api.detail.and.returnValue(of({ ...user, isActive: false }));
    facade.retryReconciliation();
    expect(facade.reconciliationError()).toBe('');
    expect(facade.pending()?.user.isActive).toBeFalse();
    facade.confirm();
    expect(api.setStatus).toHaveBeenCalledTimes(2);
  });

  it('gates reconfirmation until a delayed timeout reconciliation succeeds', () => {
    const detail = new Subject<AdminUser>();
    api.setStatus.and.returnValue(throwError(() => ({ status: 0 })));
    api.detail.and.returnValue(detail);
    facade.requestStatus(user); facade.confirm();

    expect(facade.reconciling()).toBeTrue();
    facade.confirm();
    expect(api.setStatus).toHaveBeenCalledTimes(1);
    detail.next({ ...user, isActive: false }); detail.complete();
    expect(facade.reconciling()).toBeFalse();
  });

  it('keeps a timeout pending after reconciliation failure and requires retry', () => {
    const failed = new Subject<AdminUser>();
    api.setStatus.and.returnValue(throwError(() => ({ status: 0 })));
    api.detail.and.returnValue(failed);
    facade.requestStatus(user); facade.confirm();
    failed.error({ status: 503 });

    expect(facade.reconciliationError()).toContain('No pudimos consultar');
    facade.confirm();
    expect(api.setStatus).toHaveBeenCalledTimes(1);
    api.detail.and.returnValue(of({ ...user, isActive: false }));
    facade.retryReconciliation();
    expect(facade.pending()?.user.isActive).toBeFalse();
  });

  it('reconciles an uncertain 500 result before allowing another mutation', () => {
    const failed = new Subject<AdminUser>();
    api.setRole.and.returnValue(throwError(() => ({ status: 500 })));
    api.detail.and.returnValue(failed);
    facade.requestRole(user, 'librarian'); facade.confirm();

    expect(facade.reconciling()).toBeTrue();
    facade.confirm();
    expect(api.setRole).toHaveBeenCalledTimes(1);
    failed.error({ status: 503 });
    expect(facade.reconciliationError()).toContain('No pudimos consultar');
  });

  it('does not let an old reconciliation list overwrite a newer browser query', () => {
    const staleDetail = new Subject<AdminUser>();
    const staleList = new Subject<PagedResult<AdminUser>>();
    const currentPage: PagedResult<AdminUser> = { ...page, page: 1, items: [{ ...user, role: 'admin' }], totalItems: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false };
    const currentList = new Subject<PagedResult<AdminUser>>();
    api.setStatus.and.returnValue(throwError(() => ({ status: 409 })));
    api.detail.and.returnValue(staleDetail);
    api.search.and.returnValue(staleList);
    facade.requestStatus(user); facade.confirm();

    api.search.and.returnValue(currentList);
    params.next(convertToParamMap({ role: 'admin', page: '1' }));
    currentList.next(currentPage); currentList.complete();
    staleDetail.next({ ...user, role: 'librarian', isActive: false });
    staleDetail.complete(); staleList.next(page); staleList.complete();

    expect(facade.query().role).toBe('admin');
    expect(facade.query().page).toBe(1);
    expect(facade.page()).toBe(currentPage);
  });

  it('cancels an older ordinary list before reconciliation publishes fresh rows', () => {
    const ordinaryList = new Subject<PagedResult<AdminUser>>();
    const freshPage: PagedResult<AdminUser> = { ...page, page: 1, items: [{ ...user, role: 'librarian', isActive: false }], totalItems: 1, totalPages: 1, hasPreviousPage: false, hasNextPage: false };
    api.search.and.returnValue(ordinaryList);
    facade.refresh();
    api.setStatus.and.returnValue(throwError(() => ({ status: 409 })));
    api.detail.and.returnValue(of({ ...user, role: 'librarian', isActive: false }));
    api.search.and.returnValue(of(freshPage));
    facade.requestStatus(user); facade.confirm();

    expect(facade.page()).toBe(freshPage);
    ordinaryList.next(page); ordinaryList.complete();
    expect(facade.page()).toBe(freshPage);
    expect(ordinaryList.observed).toBeFalse();
  });
});
