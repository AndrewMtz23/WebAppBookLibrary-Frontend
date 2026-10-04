import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationState } from './notification-state';
import { SessionScopeService } from '../../core/auth/session-scope.service';
import { AuthService } from '../../core/services/auth.service';

describe('NotificationState', () => {
  let state: NotificationState; let http: HttpTestingController;
  const page = { items: [{ id: 'notice', title: 'Reserva confirmada', readAt: null }], nextCursor: 12, readThrough: 24, unreadCount: 30 };
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { sessionSnapshot: { user: { id: 'a' } } } }] });
    state = TestBed.inject(NotificationState); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  it('uses the server total and explicit read boundary, then reloads', () => {
    state.load(); http.expectOne('/api/notifications/my?pageSize=20').flush(page);
    expect(state.count()).toBe(30);
    state.readAll(); const request = http.expectOne('/api/notifications/my/read-all');
    expect(request.request.body).toEqual({ through: 24 });
    expect(state.items()[0].readAt).toBeNull();
    request.flush(null);
    http.expectOne('/api/notifications/my?pageSize=20').flush({ ...page, unreadCount: 1 });
    expect(state.count()).toBe(1);
  });
  it('clears private data and cancels pending requests on identity change', () => {
    state.load(); http.expectOne('/api/notifications/my?pageSize=20').flush(page);
    state.load(true); const pending = http.expectOne('/api/notifications/my?pageSize=20&before=12');
    TestBed.inject(SessionScopeService).invalidate();
    expect(pending.cancelled).toBeTrue(); expect(state.items()).toEqual([]); expect(state.count()).toBeNull();
  });
  it('keeps the cursor after a failed next page so retry requests the same page', () => {
    state.load(); http.expectOne('/api/notifications/my?pageSize=20').flush(page);
    state.load(true); http.expectOne('/api/notifications/my?pageSize=20&before=12').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(state.error()).toBeTruthy(); expect(state.items().length).toBe(1);
    state.load(true); http.expectOne('/api/notifications/my?pageSize=20&before=12').flush({ ...page, items: [], nextCursor: null });
    expect(state.items().length).toBe(1); expect(state.nextCursor()).toBeNull();
  });
  it('retries the first page of a changed filter after reaching the last page', () => {
    state.load(); http.expectOne('/api/notifications/my?pageSize=20').flush(page);
    state.load(true); http.expectOne('/api/notifications/my?pageSize=20&before=12').flush({ ...page, items: [], nextCursor: null });
    state.setFilter('unread'); http.expectOne('/api/notifications/my?pageSize=20&read=false').flush({}, { status: 503, statusText: 'Unavailable' });
    state.retry(); http.expectOne('/api/notifications/my?pageSize=20&read=false').flush({ ...page, items: [], nextCursor: null });
    expect(state.items()).toEqual([]);
  });
});
