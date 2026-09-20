import { HttpErrorResponse, HttpHandler, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { SessionNotificationService } from '../services/session-notification.service';

describe('AuthInterceptor', () => {
  it('handles local expiration before sending a private request', () => {
    let session: any = { token: 'expired-token' };
    const auth = { get sessionSnapshot() { return session; }, getToken: () => { session = null; return null; } } as AuthService;
    const notice = jasmine.createSpyObj<SessionNotificationService>('notice', ['handleExpiredSession']);
    const next = { handle: () => throwError(() => new HttpErrorResponse({ status: 401 })) };
    new AuthInterceptor(auth, { url: '/app/my-library' } as Router, notice)
      .intercept(new HttpRequest('GET', '/api/loans/my'), next).subscribe({ error: () => undefined });
    expect(notice.handleExpiredSession).toHaveBeenCalledOnceWith('/app/my-library');
  });

  it('handles a current token rejected after it expires in flight', () => {
    const auth = jasmine.createSpyObj<AuthService>('auth', ['getToken'], { sessionSnapshot: { token: 'current-token', user: { id: '1', username: 'reader', email: 'reader@example.invalid', role: 'user' } } });
    auth.getToken.and.returnValue('current-token');
    const notice = jasmine.createSpyObj<SessionNotificationService>('notice', ['handleExpiredSession']);
    const pending = new Subject<any>();
    new AuthInterceptor(auth, { url: '/app/my-library' } as Router, notice)
      .intercept(new HttpRequest('GET', '/api/loans/my'), { handle: () => pending }).subscribe({ error: () => undefined });
    auth.getToken.and.returnValue(null);
    pending.error(new HttpErrorResponse({ status: 401 }));
    expect(notice.handleExpiredSession).toHaveBeenCalledOnceWith('/app/my-library');
  });
  it('ignores login failures and responses belonging to a previous account', () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['getToken']);
    const router = jasmine.createSpyObj<Router>('Router', [], { url: '/app/catalog' });
    const notice = jasmine.createSpyObj<SessionNotificationService>('notice', ['handleExpiredSession']);
    auth.getToken.and.returnValue('old-token');
    Object.defineProperty(auth, 'sessionSnapshot', { get: () => ({ token: auth.getToken() }) });
    const interceptor = new AuthInterceptor(auth, router, notice);
    const pending = new Subject<any>();
    interceptor.intercept(new HttpRequest('GET', '/api/profile/me'), { handle: () => pending }).subscribe({ error: () => undefined });
    auth.getToken.and.returnValue('new-token');
    pending.error(new HttpErrorResponse({ status: 401 }));
    interceptor.intercept(new HttpRequest('POST', '/api/auth/login', {}), { handle: () => throwError(() => new HttpErrorResponse({ status: 401 })) }).subscribe({ error: () => undefined });
    expect(notice.handleExpiredSession).not.toHaveBeenCalled();
    interceptor.intercept(new HttpRequest('GET', '/api/profile/me'), { handle: () => throwError(() => new HttpErrorResponse({ status: 401 })) }).subscribe({ error: () => undefined });
    expect(notice.handleExpiredSession).toHaveBeenCalledOnceWith('/app/catalog');
  });
  it('does not report an expired session for an anonymous 401', done => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['getToken']);
    const router = jasmine.createSpyObj<Router>('Router', [], { url: '/app/catalog' });
    const sessionNotification = jasmine.createSpyObj<SessionNotificationService>('SessionNotificationService', ['handleExpiredSession']);
    auth.getToken.and.returnValue(null);
    const next = { handle: () => throwError(() => new HttpErrorResponse({ status: 401 })) } as HttpHandler;

    new AuthInterceptor(auth, router, sessionNotification).intercept(new HttpRequest('GET', '/api/books'), next).subscribe({
      error: () => {
        expect(sessionNotification.handleExpiredSession).not.toHaveBeenCalled();
        done();
      }
    });
  });
});
