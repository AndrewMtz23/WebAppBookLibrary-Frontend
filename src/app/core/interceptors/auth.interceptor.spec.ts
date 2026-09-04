import { HttpErrorResponse, HttpHandler, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { SessionNotificationService } from '../services/session-notification.service';

describe('AuthInterceptor', () => {
  it('delegates session expiration on 401', done => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['getToken']);
    const router = jasmine.createSpyObj<Router>('Router', [], { url: '/app/catalog' });
    const sessionNotification = jasmine.createSpyObj<SessionNotificationService>('SessionNotificationService', ['handleExpiredSession']);
    auth.getToken.and.returnValue(null);
    const next = { handle: () => throwError(() => new HttpErrorResponse({ status: 401 })) } as HttpHandler;

    new AuthInterceptor(auth, router, sessionNotification).intercept(new HttpRequest('GET', '/api/books'), next).subscribe({
      error: () => {
        expect(sessionNotification.handleExpiredSession).toHaveBeenCalledOnceWith('/app/catalog');
        done();
      }
    });
  });
});
