import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, inject } from '@angular/core';
import { isPublicBrowseRoute, safeAuthReturnUrl } from '../../../core/auth/return-route';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { UserRole } from '../../../core/auth/auth-session.model';
import { landingRouteForRole } from '../../../core/auth/role-landing';
import { AuthService } from '../../../core/services/auth.service';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-account-menu',
  standalone: true,
  imports: [A11yModule, AvatarComponent, MatIconModule, RouterLink],
  templateUrl: './account-menu.component.html',
  styleUrl: './account-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountMenuComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  get authQuery() { return { returnUrl: safeAuthReturnUrl(this.router.url) ?? '/app/discover' }; }

  readonly session = toSignal(this.auth.session$, { initialValue: this.auth.sessionSnapshot });
  isOpen = false;
  isLogoutDialogOpen = false;
  isLoggingOut = false;

  panelRoute(role: UserRole): string { return landingRouteForRole(role); }

  panelLabel(role: UserRole): string {
    if (role === 'admin') return 'Panel administrativo';
    if (role === 'librarian') return 'Panel bibliotecario';
    return 'Ir a Descubrir';
  }

  roleLabel(role: UserRole): string {
    if (role === 'admin') return 'ADMIN';
    if (role === 'librarian') return 'BIBLIOTECARIO';
    return 'LECTOR';
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  close(): void { this.isOpen = false; }

  requestLogout(): void {
    this.close();
    this.isLogoutDialogOpen = true;
  }

  cancelLogout(): void { this.isLogoutDialogOpen = false; }

  confirmLogout(): void {
    this.isLogoutDialogOpen = false;
    this.isLoggingOut = true;
    setTimeout(() => {
      const destination = isPublicBrowseRoute(this.router.url) ? this.router.url : '/app/discover';
      this.auth.logout();
      this.isLoggingOut = false;
      this.changeDetector.markForCheck();
      void this.router.navigateByUrl(destination);
    }, 650);
  }

  @HostListener('document:click')
  closeFromOutside(): void { this.close(); }

  @HostListener('document:keydown.escape')
  closeFromEscape(): void {
    if (this.isLogoutDialogOpen) this.cancelLogout();
    else this.close();
  }
}
