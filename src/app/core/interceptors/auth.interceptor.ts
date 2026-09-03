import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { toApiError } from '../http/api-error';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler) {
    const token = this.auth.getToken();
    const authenticated = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
    return next.handle(authenticated).pipe(catchError(error => {
      const apiError = toApiError(error);
      if (apiError.status === 401) {
        this.auth.logout();
        void this.router.navigate(['/auth/login']);
      }
      return throwError(() => apiError);
    }));
  }
}
