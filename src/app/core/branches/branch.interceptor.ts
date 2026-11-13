import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BranchContextService } from './branch-context.service';

@Injectable()
export class BranchInterceptor implements HttpInterceptor {
  private readonly context = inject(BranchContextService);
  intercept(request: HttpRequest<unknown>, next: HttpHandler) {
    const url = new URL(request.url, location.origin);
    const api = new URL(environment.apiUrl || '/api', location.origin);
    const scoped = url.origin === api.origin && /^\/api\/(books|copies|loans|circulation|pickup-reservations|waitlist|renewal-requests|book-change-requests|dashboard|support|branches)(\/|$)/i.test(url.pathname);
    if (!scoped) return next.handle(request);
    const id = this.context.selectedId();
    const contextual = id ? request.clone({ setHeaders: { 'X-Branch-Id': id } }) : request;
    return next.handle(contextual).pipe(takeUntil(this.context.changed$));
  }
}
