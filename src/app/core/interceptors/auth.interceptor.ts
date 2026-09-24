import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { toApiError } from '../http/api-error';
import { AuthService } from '../services/auth.service';
import { SessionNotificationService } from '../services/session-notification.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly sessionNotification: SessionNotificationService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler) {
    const credentialRequest = /\/auth\/(login|register|password-reset\/(request|confirm)|email-verification\/confirm)(?:[/?#]|$)/.test(request.url);
    const sessionToken = this.auth.sessionSnapshot?.token;
    const token = credentialRequest ? null : this.auth.getToken();
    if (!credentialRequest && sessionToken && !token) {
      this.sessionNotification.handleExpiredSession(this.router.url);
    }
    const authenticated = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;
    return next.handle(authenticated).pipe(catchError(error => {
      const apiError = toApiError(error);
      if (apiError.status === 401 && token && token === this.auth.sessionSnapshot?.token) {
        this.sessionNotification.handleExpiredSession(this.router.url);
      }
      return throwError(() => apiError);
    }));
  }
}
