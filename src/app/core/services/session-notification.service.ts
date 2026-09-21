import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { isPublicBrowseRoute, safeAuthReturnUrl } from '../auth/return-route';

@Injectable({ providedIn: 'root' })
export class SessionNotificationService {
  private handlingExpiration = false;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  handleExpiredSession(returnUrl: string): void {
    if (this.handlingExpiration) return;
    this.handlingExpiration = true;
    const safeReturnUrl = safeAuthReturnUrl(returnUrl) ?? '/app/discover';

    this.auth.logout();
    if (isPublicBrowseRoute(safeReturnUrl)) {
      this.snackBar.open('Tu sesión terminó. Puedes seguir explorando.', 'Iniciar sesión', { duration: 6000 })
        .onAction().subscribe(() => void this.router.navigate(['/auth/login'], { queryParams: { returnUrl: safeReturnUrl } }));
      queueMicrotask(() => { this.handlingExpiration = false; });
      return;
    }
    this.snackBar.open('Tu sesión terminó. Inicia sesión nuevamente.', 'Cerrar', { duration: 4500 });
    void this.router.navigate(['/auth/login'], { queryParams: { returnUrl: safeReturnUrl } })
      .finally(() => { this.handlingExpiration = false; });
  }
}
