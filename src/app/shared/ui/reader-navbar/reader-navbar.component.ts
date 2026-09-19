import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { readerNavigationForRole } from '../../../core/navigation/navigation.config';
import { NavigationItem } from '../../../core/navigation/navigation.model';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { AccountMenuComponent } from '../account-menu/account-menu.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-reader-navbar', standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, AppBrandComponent, AccountMenuComponent, ThemeToggleComponent],
  templateUrl: './reader-navbar.component.html',
  styles: [`:host { display: contents; }
    @media (max-width: 800px) {
      .reader-navbar--mobile { display: block; }
      .reader-navbar--mobile .reader-navbar__inner { grid-template-columns: 1fr auto; gap: .5rem; padding-block: .5rem; }
      .reader-navbar--mobile .reader-navbar__navigation { grid-row: 2; grid-column: 1 / -1; overflow-x: auto; min-width: 0; min-height: 44px; }
      .reader-navbar--mobile .reader-navbar__navigation a { white-space: nowrap; }
    }`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReaderNavbarComponent {
  private readonly auth = inject(AuthService);
  private readonly session = toSignal(this.auth.session$, { initialValue: this.auth.sessionSnapshot });
  @Input() navigation: readonly NavigationItem[] | null = null;
  @Input() blocked = false;
  @Input() showOnMobile = false;
  get items(): readonly NavigationItem[] { return this.navigation ?? readerNavigationForRole(this.session()?.user.role ?? 'librarian'); }
  get primaryNavigation(): readonly NavigationItem[] { return this.items.filter(item => item.label !== 'Perfil'); }
}
