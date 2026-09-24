import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-account-recovery', standalone: true, imports: [FormsModule, RouterLink],
  template: `<article class="auth-card" aria-labelledby="recovery-title">
    <p class="eyebrow">TU CUENTA, SEGURA</p>
    <h1 id="recovery-title">{{ mode === 'forgot' ? 'Recupera tu acceso' : mode === 'reset' ? 'Una nueva contraseña' : 'Verifica tu correo' }}</h1>
    @if (success()) {
      <p role="status">{{ mode === 'forgot' ? 'Si existe una cuenta activa con ese correo, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.' : mode === 'reset' ? 'Tu contraseña se actualizó y tus sesiones anteriores se cerraron. Ya puedes iniciar sesión con la nueva.' : 'Correo verificado. Tu perfil mostrará el cambio al volver a cargarlo.' }}</p>
    } @else {
      <p>{{ mode === 'forgot' ? 'Escribe el correo con el que creaste tu cuenta. El enlace será válido durante 30 minutos.' : mode === 'reset' ? 'Elige una contraseña para volver a tu biblioteca.' : 'Confirma para verificar el correo asociado a este enlace. Abrir esta página no realiza ningún cambio.' }}</p>
      @if (mode === 'forgot' || hasToken) {
        <form (ngSubmit)="submit()" #form="ngForm">
          @if (mode === 'forgot') {
            <label for="recovery-email">Correo electrónico<input id="recovery-email" name="email" type="email" autocomplete="email" required email maxlength="254" [(ngModel)]="email" [disabled]="busy()"></label>
          }
          @if (mode === 'reset') {
            <label for="recovery-password">Nueva contraseña<input id="recovery-password" name="newPassword" type="password" autocomplete="new-password" required minlength="5" maxlength="1024" [(ngModel)]="newPassword" [disabled]="busy()" aria-describedby="recovery-policy"></label>
            <label for="recovery-confirm">Confirmar contraseña<input id="recovery-confirm" name="confirmPassword" type="password" autocomplete="new-password" required maxlength="1024" [(ngModel)]="confirmPassword" [disabled]="busy()"></label>
            <p id="recovery-policy" class="hint">Al menos 5 caracteres, una mayúscula, una minúscula y un número.</p>
          }
          @if (error()) { <p role="alert" class="error">{{ error() }}</p> }
          <button type="submit" [disabled]="busy() || form.invalid">{{ busy() ? 'Procesando…' : mode === 'forgot' ? 'Solicitar enlace' : mode === 'reset' ? 'Guardar nueva contraseña' : 'Confirmar mi correo' }}</button>
        </form>
      } @else { <p role="alert">Este enlace está incompleto. Solicita uno nuevo y ábrelo desde tu correo.</p> }
    }
    <nav aria-label="Opciones de acceso"><a routerLink="/auth/login">Volver a iniciar sesión</a>
      @if (mode === 'reset') { <a routerLink="/auth/forgot-password">Solicitar otro enlace</a> }
      @if (mode === 'verify') { <a routerLink="/app/profile">Ir a mi perfil</a> }
    </nav>
  </article>`,
  styles: [`
    :host { display: block; width: 100%; }
    .auth-card { padding: clamp(1.5rem, 4vw, 2.5rem); border: 1px solid var(--color-border); border-radius: 24px; background: var(--color-surface); color: var(--color-text); }
    .eyebrow { color: var(--color-primary); font-size: .75rem; letter-spacing: .12em; font-weight: 700; }
    h1 { font-size: clamp(1.8rem, 4vw, 2.5rem); line-height: 1.15; margin: .75rem 0 1rem; }
    p { line-height: 1.65; color: var(--color-text-muted); } form { display: grid; gap: 1.25rem; margin-block: 1.5rem; }
    label { display: grid; gap: .5rem; font-size: .9rem; font-weight: 600; }
    input { width: 100%; box-sizing: border-box; min-height: 48px; padding: .75rem; border-radius: 8px; border: 1px solid var(--color-border-strong); background: var(--color-surface); color: var(--color-text); font: inherit; }
    button { min-height: 48px; padding: .75rem; border: 0; border-radius: 8px; font: inherit; font-weight: 600; background: var(--color-primary); color: var(--color-on-primary); cursor: pointer; }
    button:disabled { opacity: .6; cursor: default; } nav { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1.5rem; }
    a { color: var(--color-primary); } .hint { font-size: .85rem; margin: 0; } .error { color: var(--color-danger); margin: 0; }
    :is(a,button,input):focus-visible { outline: 2px solid var(--color-primary); outline-offset: 4px; }
  `]
})
export class AccountRecoveryComponent {
  private readonly route = inject(ActivatedRoute); private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  readonly mode: 'forgot' | 'reset' | 'verify' = this.route.snapshot.data['mode'];
  private token = new URLSearchParams(this.route.snapshot.fragment ?? '').get('token') ?? '';
  readonly hasToken = /^[A-Za-z0-9_-]{43}$/.test(this.token);
  readonly busy = signal(false); readonly success = signal(false); readonly error = signal('');
  email = ''; newPassword = ''; confirmPassword = '';
  constructor() {
    const path = this.mode === 'reset' ? 'reset-password' : this.mode === 'verify' ? 'verify-email' : 'forgot-password';
    inject(Location).replaceState('/auth/' + path);
    this.destroyRef.onDestroy(() => { this.token = this.newPassword = this.confirmPassword = ''; });
  }
  submit(): void {
    if (this.busy() || this.success()) return;
    this.error.set('');
    if (this.mode !== 'forgot' && !this.hasToken) return;
    if (this.mode === 'forgot' && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim()) || this.email.trim().length > 254)) { this.error.set('Escribe un correo válido.'); return; }
    if (this.mode === 'reset' && (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{5,}$/.test(this.newPassword) || this.newPassword.length > 1024 || this.newPassword !== this.confirmPassword)) { this.error.set('Revisa los requisitos y que ambas contraseñas coincidan.'); return; }
    this.busy.set(true);
    const path = this.mode === 'forgot' ? 'password-reset/request' : this.mode === 'reset' ? 'password-reset/confirm' : 'email-verification/confirm';
    const body = this.mode === 'forgot' ? { email: this.email.trim() } : this.mode === 'reset' ? { token: this.token, newPassword: this.newPassword } : { token: this.token };
    this.http.post('/api/auth/' + path, body).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.busy.set(false); this.success.set(true); this.token = this.newPassword = this.confirmPassword = ''; },
      error: response => { this.busy.set(false); this.error.set(response.status === 429 ? 'Espera un minuto antes de intentarlo otra vez.' : response.status === 503 || response.status === 0 ? 'El servicio no está disponible en este momento. Intenta más tarde.' : this.mode === 'forgot' ? 'No pudimos procesar la solicitud. Intenta nuevamente.' : 'El enlace venció, ya se usó o dejó de ser válido. Solicita uno nuevo.'); }
    });
  }
}
