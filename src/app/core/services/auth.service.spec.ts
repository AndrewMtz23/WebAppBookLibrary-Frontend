import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

const token = (exp: number) => `x.${btoa(JSON.stringify({ exp }))}.x`;

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.clear(); });

  it('clears an expired token', () => {
    localStorage.setItem('jwt_token', token(1));
    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('jwt_token')).toBeNull();
  });

  it('registers without sending a role', () => {
    service.register({ username: 'ana', password: 'Secure1', email: 'ana@example.com' }).subscribe();
    const request = http.expectOne('/api/auth/register');
    expect(request.request.body.role).toBeUndefined();
    request.flush({ message: 'created' });
  });
});
