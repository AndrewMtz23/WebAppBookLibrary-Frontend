import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { takeUntil, timeout } from 'rxjs';
import { SessionScopeService } from '../../core/auth/session-scope.service';
@Component({ selector: 'app-circulation-summary', standalone: true, template: `<section aria-label="Circulación actual"><h2>Circulación actual</h2>@if (data(); as d) { <dl><div><dt>Listos para recoger</dt><dd>{{ d.ready }}</dd></div><div><dt>En espera</dt><dd>{{ d.queued }}</dd></div><div><dt>Entregados con nueva política</dt><dd>{{ d.loaned }}</dd></div><div><dt>Renovaciones pendientes</dt><dd>{{ d.pendingRenewals }}</dd></div></dl> } @else { <p>{{ error() ? 'No pudimos consultar los contadores.' : 'Cargando contadores…' }}</p> }<button type="button" (click)="load()">Actualizar circulación</button></section>`, styles: [`section { margin-block: 1.5rem; } dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; } dl > div { padding: 1rem; border: 1px solid var(--color-border); border-radius: 12px; } dd { font-size: 2rem; margin: .5rem 0 0; } button { padding: .7rem; color: var(--color-text); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; }`] })
export class CirculationSummaryComponent {
  private readonly http = inject(HttpClient); private readonly scope = inject(SessionScopeService); private readonly destroy = inject(DestroyRef);
  readonly data = signal<{ready: number; queued: number; loaned: number; pendingRenewals: number} | null>(null); readonly error = signal(false);
  constructor() { this.load(); this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(() => this.data.set(null)); }
  load() { this.error.set(false); this.http.get<{ready: number; queued: number; loaned: number; pendingRenewals: number}>('/api/circulation/summary').pipe(timeout(20000), takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe({ next: d => this.data.set(d), error: () => this.error.set(true) }); }
}
