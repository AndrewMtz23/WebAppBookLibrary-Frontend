import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subscription, forkJoin, of, takeUntil } from 'rxjs';
import { CirculationService, Pickup, Renewal, WaitEntry } from './circulation.service';
import { CirculationConfirmComponent } from './circulation-confirm.component';
import { SessionScopeService } from '../../core/auth/session-scope.service';
import { LoanSummary } from '../../shared/models/loan.model';

@Component({ selector: 'app-circulation-panel', standalone: true, imports: [DatePipe, FormsModule, RouterLink, MatButtonModule],
  templateUrl: './circulation-panel.component.html', styleUrl: './circulation-panel.component.scss' })
export class CirculationPanelComponent implements OnInit {
  @Input() staff = false; @Input() loans: readonly LoanSummary[] = []; @Output() changed = new EventEmitter<void>();
  readonly api = inject(CirculationService); private readonly dialogs = inject(MatDialog); private readonly scope = inject(SessionScopeService); private readonly destroy = inject(DestroyRef);
  readonly pickups = signal<Pickup[]>([]); readonly renewals = signal<Renewal[]>([]); readonly waiting = signal<WaitEntry[]>([]);
  readonly loading = signal(false); readonly error = signal(false); readonly busy = signal(false); readonly message = signal('');
  readonly labels: Record<string,string> = { ready: 'Listo para recoger', collected: 'Entregado', cancelled: 'Cancelado', expired: 'Vencido', queued: 'En espera', offered: 'Oferta disponible', fulfilled: 'Entregado', pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' };
  readonly zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  search = ''; status = ''; page = 1; total = 0; private loadingRequest?: Subscription;
  ngOnInit() { this.load(); this.scope.changed$.pipe(takeUntilDestroyed(this.destroy)).subscribe(() => { this.pickups.set([]); this.renewals.set([]); this.waiting.set([]); this.message.set(''); this.busy.set(false); }); }
  load() {
    this.loadingRequest?.unsubscribe(); this.loading.set(true); this.error.set(false);
    this.loadingRequest = forkJoin({ pickups: this.api.pickups(this.staff, this.page, this.search, this.status === 'ready' ? 'ready' : ''), renewals: this.api.renewals(this.staff, this.page, this.search, this.status === 'pending' ? 'pending' : ''), waiting: this.staff ? of({ items: [] as WaitEntry[], totalCount: 0 }) : this.api.waitlist(this.page) }).pipe(takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe({
      next: data => { this.pickups.set(data.pickups.items); this.renewals.set(data.renewals.items); this.waiting.set(data.waiting.items); this.total = Math.max(data.pickups.totalCount, data.renewals.totalCount, data.waiting.totalCount); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set(true); }
    });
  }
  filter() { this.page = 1; this.load(); }
  turn(delta: number) { this.page += delta; this.load(); }
  collect(p: Pickup) { this.confirm('Confirmar entrega', `Confirma que entregaste «${p.bookTitle}» al lector. El plazo empieza ahora.`, () => this.api.collect(p)); }
  cancel(p: Pickup) { this.confirm('Cancelar recogida', 'El ejemplar quedará disponible para la siguiente persona en espera.', () => this.api.cancel(p)); }
  leave(w: WaitEntry) { this.confirm('Salir de la espera', 'Perderás tu posición y cualquier oferta pendiente de esta solicitud.', () => this.api.leave(w.id)); }
  renew(loan: LoanSummary) { this.confirm('Solicitar renovación', 'El personal revisará tu solicitud. Conserva la fecha actual hasta recibir la aprobación.', () => this.api.request(loan.id)); }
  decide(r: Renewal, approve: boolean) { this.confirm(approve ? 'Aprobar renovación' : 'Rechazar renovación', approve ? 'El servidor comprobará nuevamente el plazo y la lista de espera.' : 'Explica al lector por qué no se puede ampliar el plazo.', reason => this.api.decide(r, approve, reason), !approve); }
  canRenew(loan: LoanSummary) { return loan.policyVersion === 'circulation-v1' && loan.status === 'active' && (loan.renewalCount ?? 0) < 1 && !this.renewals().some(r => r.loanId === loan.id && r.status === 'pending'); }
  loanTitle(loan: LoanSummary) { return (loan as LoanSummary & { book?: { title?: string } }).book?.title || 'Préstamo físico'; }
  private confirm(title: string, message: string, request: (reason: string) => Observable<unknown>, reason = false) {
    if (this.busy()) return;
    this.dialogs.open(CirculationConfirmComponent, { width: '440px', maxWidth: 'calc(100vw - 32px)', data: { title, message, reason } }).afterClosed().pipe(takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe(value => {
      if (!value) return; this.busy.set(true); this.message.set('');
      request(value.reason).pipe(takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe({
        next: () => { this.busy.set(false); this.message.set('Operación confirmada.'); this.load(); this.changed.emit(); },
        error: e => { this.busy.set(false); this.message.set(e.status === 409 ? 'El estado cambió o la operación ya no es elegible. Actualizamos la información; los filtros se conservan.' : 'No recibimos confirmación. Revisa el estado actualizado antes de repetir la acción.'); this.load(); this.changed.emit(); }
      });
    });
  }
}
