import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

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
});
