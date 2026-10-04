import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { NotificationState } from './notification-state';

@Component({ selector: 'app-notification-bell', standalone: true, imports: [RouterLink, MatIconModule], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (session()) { <a routerLink="/app/notifications" [attr.aria-label]="label" (focus)="state.refreshCount()"><mat-icon aria-hidden="true">notifications_none</mat-icon>@if (state.count(); as count) { <span aria-hidden="true">{{ count > 99 ? '99+' : count }}</span> }</a> }`,
  styles: [`:host { display: inline-flex; } a { position: relative; width: 44px; height: 44px; display: grid; place-items: center; color: var(--color-text); border-radius: 50%; text-decoration: none; } a:focus-visible { outline: 3px solid var(--color-text); outline-offset: 2px; } span { position: absolute; right: 0; top: 0; min-width: 16px; padding: 2px; border-radius: 10px; font: 600 10px var(--font-body); color: var(--color-surface); background: var(--color-text); text-align: center; }`]
})
export class NotificationBellComponent {
  private readonly auth = inject(AuthService);
  readonly state = inject(NotificationState);
  readonly session = toSignal(this.auth.session$, { initialValue: this.auth.sessionSnapshot });
  get label(): string { return this.state.count() === null ? 'Notificaciones; contador no disponible' : `Notificaciones, ${this.state.count()} sin leer`; }
  constructor() {
    this.state.refreshCount();
    const refresh = () => { if (!document.hidden) this.state.refreshCount(); };
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    inject(DestroyRef).onDestroy(() => { window.clearInterval(interval); window.removeEventListener('focus', refresh); });
  }
}
