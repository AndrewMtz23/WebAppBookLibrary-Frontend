import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-footer',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="admin-footer" aria-label="Pie del panel administrativo">
      <p><strong>BookLibrary</strong><span>© {{ year }} · Tu biblioteca, conectada.</span></p>
      <nav aria-label="Enlaces del panel">
        <a routerLink="/app/discover"><mat-icon aria-hidden="true">home</mat-icon>Biblioteca</a>
        <a routerLink="/privacy"><mat-icon aria-hidden="true">shield</mat-icon>Privacidad</a>
        <a routerLink="/legal"><mat-icon aria-hidden="true">info</mat-icon>Información legal</a>
      </nav>
      <span class="admin-footer__session"><i aria-hidden="true"></i>Sesión activa<span class="admin-footer__username">{{ username }}</span></span>
    </footer>
  `,
  styles: [`
    :host { display: block; margin-top: auto; }
    .admin-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; padding: 1.1rem 2rem; border-top: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-muted); font-size: .75rem; }
    p, nav, .admin-footer__session { display: flex; align-items: center; flex-wrap: wrap; gap: .75rem; margin: 0; }
    strong { color: var(--color-primary); }
    nav { gap: .5rem; }
    a { display: inline-flex; align-items: center; gap: .4rem; min-height: 44px; padding: .5rem .7rem; border: 1px solid var(--color-border); border-radius: .65rem; color: var(--color-text-muted); text-decoration: none; }
    a:hover { color: var(--color-primary); background: var(--color-primary-soft); }
    a:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; }
    mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
    i { width: .4rem; height: .4rem; border-radius: 50%; background: var(--color-success); }
    .admin-footer__username { max-width: 10rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; }
    @media(max-width: 800px) { .admin-footer { padding: 1.25rem 1rem; } nav { width: 100%; } }
  `]
})
export class AdminFooterComponent {
  @Input() username = '';
  readonly year = new Date().getFullYear();
}
