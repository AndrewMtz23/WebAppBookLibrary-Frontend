import { HttpErrorResponse, HttpHandler, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  it('logs out and redirects on 401', done => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'logout']);
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    auth.getToken.and.returnValue(null);
    router.navigate.and.returnValue(Promise.resolve(true));
    const next = { handle: () => throwError(() => new HttpErrorResponse({ status: 401 })) } as HttpHandler;

    new AuthInterceptor(auth, router).intercept(new HttpRequest('GET', '/api/books'), next).subscribe({
      error: () => {
        expect(auth.logout).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
        done();
      }
    });
  });
});
