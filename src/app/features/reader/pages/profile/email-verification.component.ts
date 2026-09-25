import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-email-verification', standalone: true,
  template: `<section aria-labelledby="verification-heading"><div><h2 id="verification-heading">Tu correo electrónico</h2>
    <p class="address">{{ email() }}</p><p>{{ verifiedAt() ? 'Correo verificado' : 'Correo pendiente de verificación. Confirma que esta dirección te pertenece.' }}</p></div>
    @if (!verifiedAt()) { <button type="button" (click)="request()" [disabled]="busy()">{{ busy() ? 'Solicitando…' : 'Solicitar verificación' }}</button> }
    @if (message()) { <p role="status">{{ message() }}</p> }
    @if (error()) { <p role="alert" class="error">{{ error() }}</p> }
  </section>`,
  styles: [`:host { display: block; margin-top: 2rem; } section { padding: clamp(1rem, 3vw, 2rem); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); color: var(--color-text); } h2 { margin: 0; font-size: 1.4rem; } p { line-height: 1.6; color: var(--color-text-muted); } .address { overflow-wrap: anywhere; } button { padding: .75rem 1rem; min-height: 46px; background: var(--color-primary); color: var(--color-on-primary); border: 0; border-radius: var(--radius-sm); font: inherit; cursor: pointer; } button:disabled { opacity: .6; } button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 4px; } .error { color: var(--color-danger); }`]
})
export class EmailVerificationComponent {
  readonly email = input.required<string>(); readonly verifiedAt = input<string | null>();
  readonly busy = signal(false); readonly message = signal(''); readonly error = signal('');
  private readonly http = inject(HttpClient); private readonly destroyRef = inject(DestroyRef);
  constructor() { effect(() => { this.email(); this.message.set(''); this.error.set(''); }); }
  request(): void {
    if (this.busy() || this.verifiedAt()) return;
    this.busy.set(true); this.error.set(''); this.message.set('');
    this.http.post('/api/auth/email-verification/request', {}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.busy.set(false); this.message.set('Solicitud en cola. Revisa tu correo y abre el enlace para confirmar. Es válido durante 24 horas.'); },
      error: response => { this.busy.set(false); this.error.set(response.status === 429 ? 'Espera un minuto antes de solicitar otro enlace.' : 'No pudimos solicitar la verificación. Intenta más tarde.'); }
    });
  }
}
