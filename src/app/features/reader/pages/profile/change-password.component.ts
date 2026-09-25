import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { OperationNotificationService } from '../../../../core/services/operation-notification.service';

@Component({
  selector: 'app-change-password', standalone: true, imports: [FormsModule],
  template: `<section aria-labelledby="password-heading"><h2 id="password-heading">Seguridad de tu cuenta</h2>
    <p>Al cambiar la contraseña se cerrarán todas tus sesiones. Después podrás ingresar con la nueva.</p>
    <form (ngSubmit)="submit()" #form="ngForm">
      <fieldset [disabled]="busy()"><legend class="sr-only">Cambiar contraseña</legend>
        <label for="current-password">Contraseña actual<input id="current-password" name="currentPassword" type="password" autocomplete="current-password" required maxlength="1024" [(ngModel)]="currentPassword"></label>
        <label for="new-password">Nueva contraseña<input id="new-password" name="newPassword" type="password" autocomplete="new-password" required minlength="5" maxlength="1024" aria-describedby="password-policy" [(ngModel)]="newPassword"></label>
        <label for="confirm-password">Confirmar nueva contraseña<input id="confirm-password" name="confirmPassword" type="password" autocomplete="new-password" required maxlength="1024" [(ngModel)]="confirmPassword"></label>
      </fieldset>
      <p id="password-policy" class="help">Usa al menos 5 caracteres, una mayúscula, una minúscula y un número.</p>
      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
      <button type="submit" [disabled]="busy() || form.invalid">{{ busy() ? 'Cambiando contraseña…' : 'Cambiar contraseña' }}</button>
    </form></section>`,
  styles: [`
    :host { display: block; margin-block: 2rem; }
    section { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: clamp(1rem, 3vw, 2rem); }
    h2 { margin: 0 0 .5rem; font-size: 1.4rem; } p { line-height: 1.6; }
    fieldset { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; border: 0; padding: 0; margin: 1.5rem 0 0; min-width: 0; }
    label { display: grid; gap: .5rem; font-weight: 600; font-size: .9rem; }
    input { min-width: 0; width: 100%; box-sizing: border-box; min-height: 46px; padding: .7rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface); color: var(--color-text); font: inherit; }
    button { min-height: 46px; padding: .7rem 1.1rem; border: 1px solid var(--color-primary); border-radius: var(--radius-sm); background: var(--color-primary); color: var(--color-on-primary); font: inherit; cursor: pointer; }
    button:disabled { opacity: .5; cursor: default; } .help { color: var(--color-text-muted); font-size: .85rem; } .error { color: var(--color-danger); }
    :is(input,button):focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    @media(max-width: 800px) { fieldset { grid-template-columns: minmax(0, 1fr); } }
  `]
})
export class ChangePasswordComponent {
  private readonly http = inject(HttpClient); private readonly auth = inject(AuthService);
  private readonly router = inject(Router); private readonly notifications = inject(OperationNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false); readonly error = signal('');
  currentPassword = ''; newPassword = ''; confirmPassword = '';
  submit() {
    if (this.busy()) return;
    this.error.set('');
    if (!this.currentPassword || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/.test(this.newPassword) || this.newPassword.length > 1024) { this.error.set('Completa la contraseña actual y revisa los requisitos de la nueva.'); return; }
    if (this.newPassword !== this.confirmPassword) { this.error.set('La confirmación no coincide con la nueva contraseña.'); return; }
    if (this.currentPassword === this.newPassword) { this.error.set('Elige una contraseña diferente de la actual.'); return; }
    this.busy.set(true);
    this.http.put<void>('/api/profile/me/password', { currentPassword: this.currentPassword, newPassword: this.newPassword })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.currentPassword = this.newPassword = this.confirmPassword = ''; this.busy.set(false);
          this.auth.logout(); this.notifications.success('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
          void this.router.navigate(['/auth/login']);
        },
        error: response => {
          this.busy.set(false);
          this.error.set((response.code ?? response.error?.code) === 'current_password_invalid' ? 'La contraseña actual no es correcta.'
            : response.status === 429 ? 'Espera un minuto antes de volver a intentarlo.'
            : response.status === 409 ? 'Tu sesión cambió. Inicia sesión nuevamente antes de cambiar la contraseña.'
            : 'No pudimos cambiar la contraseña. Revisa los datos e intenta de nuevo.');
        }
      });
  }
}
