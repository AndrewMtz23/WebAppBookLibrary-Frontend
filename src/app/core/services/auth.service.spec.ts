import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SessionScopeService } from '../auth/session-scope.service';

const token = (exp: number) => `x.${btoa(JSON.stringify({ exp }))}.x`;

describe('AuthService', () => {
  let http: HttpTestingController;

  const createService = (): AuthService => TestBed.inject(AuthService);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.clear(); });

  it('clears an expired token', () => {
    localStorage.setItem('jwt_token', token(1));
    const service = createService();

    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('jwt_token')).toBeNull();
  });

  it('registers without sending a role', () => {
    const service = createService();

    service.register({ username: 'ana', password: 'Secure1', email: 'ana@example.com' }).subscribe();
    const request = http.expectOne('/api/auth/register');
    expect(request.request.body.role).toBeUndefined();
    request.flush({ message: 'created' });
  });

  it('restores a valid typed session from storage', () => {
    const session = {
      token: token(Math.floor(Date.now() / 1000) + 3600),
      user: { id: 'u1', username: 'ana', email: 'ana@example.com', role: 'admin' as const }
    };
    localStorage.setItem('booklibrary_session', JSON.stringify(session));

    expect(createService().sessionSnapshot).toEqual(session);
  });

  it('removes malformed persisted session', () => {
    localStorage.setItem('booklibrary_session', '{bad json');

    expect(createService().sessionSnapshot).toBeNull();
    expect(localStorage.getItem('booklibrary_session')).toBeNull();
  });

  it('persists login as one session object', () => {
    const service = createService();
    const response = {
      token: token(Math.floor(Date.now() / 1000) + 3600),
      user: { id: 'u1', username: 'ana', email: 'ana@example.com', role: 'user' as const }
    };

    service.login({ email: 'ana@example.com', password: 'Secure1' }).subscribe();
    http.expectOne('/api/auth/login').flush(response);

    expect(JSON.parse(localStorage.getItem('booklibrary_session')!)).toEqual(response);
    expect(localStorage.getItem('user')).toBeNull();
    expect(service.sessionSnapshot).toEqual(response);
  });

  it('adopts the current shared session and clears it on cross-tab logout without rewriting storage', () => {
    const service = createService();
    const scope = TestBed.inject(SessionScopeService);
    const session = { token: token(Math.floor(Date.now() / 1000) + 3600), user: { id: 'u2', username: 'bea', email: 'bea@example.invalid', role: 'user' as const } };
    const start = scope.version;
    localStorage.setItem('booklibrary_session', JSON.stringify(session));
    const write = spyOn(localStorage, 'setItem').and.callThrough();
    window.dispatchEvent(new StorageEvent('storage', { key: 'booklibrary_session', storageArea: localStorage, newValue: 'stale queued value' }));
    expect(service.sessionSnapshot).toEqual(session);
    expect(scope.version).toBe(start + 1);
    expect(write).not.toHaveBeenCalled();
    localStorage.removeItem('booklibrary_session');
    window.dispatchEvent(new StorageEvent('storage', { key: null, storageArea: localStorage }));
    expect(service.sessionSnapshot).toBeNull(); expect(scope.version).toBe(start + 2);
  });

  it('updates the same identity without cancelling work and rejects malformed cross-tab data', () => {
    const original = { token: token(Math.floor(Date.now() / 1000) + 3600), user: { id: 'u1', username: 'ana', email: 'ana@example.invalid', role: 'user' as const } };
    localStorage.setItem('booklibrary_session', JSON.stringify(original));
    const service = createService(); const scope = TestBed.inject(SessionScopeService); const start = scope.version;
    localStorage.setItem('booklibrary_session', JSON.stringify({ ...original, user: { ...original.user, displayName: 'Ana nueva' } }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'booklibrary_session', storageArea: localStorage }));
    expect(service.sessionSnapshot?.user.displayName).toBe('Ana nueva'); expect(scope.version).toBe(start);
    localStorage.setItem('booklibrary_session', '{bad json');
    window.dispatchEvent(new StorageEvent('storage', { key: 'booklibrary_session', storageArea: localStorage }));
    expect(service.sessionSnapshot).toBeNull(); expect(scope.version).toBe(start + 1);
  });
});
