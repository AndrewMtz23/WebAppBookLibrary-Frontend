import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReadingFacade } from './reading.facade';
import { SessionScopeService } from '../../../core/auth/session-scope.service';
import { AuthService } from '../../../core/services/auth.service';
import { OperationNotificationService } from '../../../core/services/operation-notification.service';

describe('ReadingFacade', () => {
  let facade: ReadingFacade;
  let http: HttpTestingController;
  let notices: jasmine.SpyObj<OperationNotificationService>;
  beforeEach(() => {
    notices = jasmine.createSpyObj('notices', ['success', 'error']);
    TestBed.configureTestingModule({ providers: [ReadingFacade, provideHttpClient(), provideHttpClientTesting(),
      { provide: AuthService, useValue: { sessionSnapshot: { user: { id: 'a', role: 'user' } } } },
      { provide: OperationNotificationService, useValue: notices }] });
    facade = TestBed.inject(ReadingFacade); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify({ ignoreCancelled: true }));
  const empty = { items: [], page: 1, pageSize: 20, totalItems: 0, counts: { wantToRead: 0, reading: 0, finished: 0 } };

  it('cancels old filters and clears personal data after a session change', () => {
    facade.load({ status: 'reading' }); const first = http.expectOne(r => r.url === '/api/reading/my');
    facade.load({ status: 'finished' }); expect(first.cancelled).toBeTrue();
    const second = http.expectOne(r => r.params.get('status') === 'finished');
    second.flush({ ...empty, totalItems: 1, items: [{ bookId: 'private' }] });
    TestBed.inject(SessionScopeService).invalidate();
    expect(facade.list().data.items).toEqual([]); expect(facade.saveError()).toBe('');
    expect(notices.success).not.toHaveBeenCalled();
  });
  it('does not confirm a save until the server replies and preserves conflict state', () => {
    const request = { status: 'reading' as const, progressMode: 'percent' as const, progressPercent: 37, currentPage: null, expectedRevision: 'id:1', confirmReset: false, adoptCurrentPageCount: false };
    facade.save('book', request); facade.save('book', request);
    const save = http.expectOne('/api/reading/my/books/book');
    expect(save.request.body.progressPercent).toBe(37); expect(facade.saving()).toBeTrue();
    expect(notices.success).not.toHaveBeenCalled();
    save.flush({ code: 'reading_conflict' }, { status: 409, statusText: 'Conflict' });
    expect(facade.conflict()).toBeTrue(); expect(facade.saving()).toBeFalse(); expect(facade.saveError()).toContain('otro dispositivo');
    facade.save('book', request); http.expectNone('/api/reading/my/books/book');
  });
  it('ignores pending mutation and latest requests when the account changes', () => {
    facade.loadLatest(); const latest = http.expectOne('/api/reading/my/latest');
    facade.remove('book', 'abc:1'); const remove = http.expectOne(r => r.method === 'DELETE');
    expect(remove.request.params.get('expectedRevision')).toBe('abc:1');
    TestBed.inject(SessionScopeService).invalidate();
    expect(latest.cancelled).toBeTrue(); expect(remove.cancelled).toBeTrue();
    expect(facade.latest().data).toBeNull(); expect(facade.saving()).toBeFalse(); expect(notices.success).not.toHaveBeenCalled();
  });
  it('distinguishes a failed load from an empty result', () => {
    facade.load({}); http.expectOne(r => r.url === '/api/reading/my').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(facade.list().error).toBeTruthy(); expect(facade.list().loading).toBeFalse();
    facade.load({}); http.expectOne(r => r.url === '/api/reading/my').flush(empty);
    expect(facade.list().error).toBeNull(); expect(facade.list().data.items.length).toBe(0);
  });

  it('requires a server reload after a response is lost instead of repeating an uncertain write', () => {
    facade.remove('book', 'abc:1');
    http.expectOne(r => r.method === 'DELETE').error(new ProgressEvent('error'));
    expect(facade.saving()).toBeFalse(); expect(facade.conflict()).toBeTrue();
    expect(facade.saveError()).toContain('confirmar');
    expect(notices.success).not.toHaveBeenCalled();
    facade.resetFeedback(); // Opening a card again must not bypass reconciliation.
    facade.remove('book', 'abc:1'); http.expectNone(r => r.method === 'DELETE');
    facade.load({});
    http.expectOne(r => r.method === 'GET').flush(empty);
    expect(facade.conflict()).toBeFalse(); expect(facade.saveError()).toBe('');
  });

  it('ends a stalled write after twenty seconds without claiming failure or success', fakeAsync(() => {
    facade.remove('book', 'abc:1'); const pending = http.expectOne(r => r.method === 'DELETE');
    tick(20_000);
    expect(pending.cancelled).toBeTrue(); expect(facade.saving()).toBeFalse();
    expect(facade.conflict()).toBeTrue(); expect(facade.saveError()).toContain('confirmar');
    expect(notices.success).not.toHaveBeenCalled();
  }));
});
