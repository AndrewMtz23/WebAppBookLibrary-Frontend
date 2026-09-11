import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { StaffLoansApi } from './staff-loans.api';
import { DEFAULT_STAFF_LOAN_QUERY, LoanCommand, StaffLoan, StaffLoanDetail, StaffLoanQuery, parseLoanQuery } from './staff-loans.models';
@Injectable()
export class StaffLoansFacade {
  private readonly api = inject(StaffLoansApi); private readonly router = inject(Router); private readonly route = inject(ActivatedRoute); private readonly auth = inject(AuthService); private readonly destroy = inject(DestroyRef);
  readonly query = signal({ ...DEFAULT_STAFF_LOAN_QUERY }); readonly page = signal<PagedResult<StaffLoan> | null>(null); readonly loading = signal(false); readonly error = signal('');
  readonly selectedId = signal<string | null>(null); readonly detail = signal<StaffLoanDetail | null>(null); readonly detailLoading = signal(false); readonly detailError = signal(''); readonly busy = signal(false); readonly pending = signal<LoanCommand | null>(null); readonly notice = signal('');
  private listRequest?: Subscription; private detailRequest?: Subscription; private commandRequest?: Subscription;
  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => { this.query.set(parseLoanQuery(params)); this.refresh(); });
    this.destroy.onDestroy(() => { this.listRequest?.unsubscribe(); this.detailRequest?.unsubscribe(); this.commandRequest?.unsubscribe(); });
  }
  filters(patch: Partial<StaffLoanQuery>) { this.navigate({ ...this.query(), ...patch, page: 1 }); }
  paginate(page: number) { this.navigate({ ...this.query(), page }); }
  clear() { this.navigate({ ...DEFAULT_STAFF_LOAN_QUERY }); }
  private navigate(query: StaffLoanQuery) { void this.router.navigate([], { relativeTo: this.route, queryParams: query }); }
  quick(view: string) {
    const now = new Date(); const end = new Date(now.getTime() + 3 * 86400000);
    this.filters({ status: view === 'digital' ? '' : view === 'due' ? 'outstanding' : view, mediaType: view === 'digital' ? 'digital' : '', dueFrom: view === 'due' ? now.toISOString() : '', dueTo: view === 'due' ? end.toISOString() : '', from: '', to: '', dateField: 'reservedAt' });
  }
  refresh() {
    this.listRequest?.unsubscribe(); this.loading.set(true); this.error.set('');
    this.listRequest = this.api.search(this.query()).subscribe({ next: page => { this.page.set(page); this.loading.set(false); }, error: error => { this.loading.set(false); this.error.set(this.message(error, 'No pudimos cargar los préstamos. Intenta actualizar.')); } });
  }
  open(id: string) { if (this.busy()) return; this.selectedId.set(id); this.notice.set(''); this.pending.set(null); this.loadDetail(); }
  reloadDetail() { if (!this.busy()) this.loadDetail(); }
  private loadDetail() {
    const id = this.selectedId(); if (!id) return;
    this.detailRequest?.unsubscribe(); this.detail.set(null); this.detailLoading.set(true); this.detailError.set('');
    this.detailRequest = this.api.detail(id).subscribe({ next: detail => { this.detail.set(detail); this.detailLoading.set(false); }, error: error => { this.detailLoading.set(false); this.detailError.set(this.message(error, error.status === 404 ? 'Este préstamo ya no está disponible.' : 'No pudimos consultar el estado actual.')); } });
  }
  close() { if (this.busy()) return; this.detailRequest?.unsubscribe(); this.selectedId.set(null); this.detail.set(null); this.pending.set(null); }
  canAct(command: LoanCommand) { const loan = this.detail()?.loan; return !this.busy() && !this.detailLoading() && ['admin','librarian'].includes(this.auth.getUserRole() ?? '') && !!loan && ['active','overdue'].includes(loan.status) && (command === 'cancel' || loan.mediaType === 'physical'); }
  request(command: LoanCommand) { if (this.canAct(command)) this.pending.set(command); }
  dismiss() { if (!this.busy()) this.pending.set(null); }
  confirm() {
    const command = this.pending(); const id = this.selectedId(); if (!command || !id || !this.canAct(command)) return;
    this.busy.set(true); this.notice.set('');
    this.commandRequest = this.api.complete(id, command).subscribe({ next: result => {
      this.busy.set(false); this.pending.set(null); this.notice.set(result.idempotent ? 'La operación ya estaba registrada. Estado actualizado.' : command === 'return' ? 'Devolución registrada.' : 'Cancelación registrada.'); this.loadDetail(); this.refresh();
    }, error: error => {
      this.busy.set(false); this.pending.set(null);
      this.notice.set(error.status === 409 ? 'El préstamo cambió mientras trabajabas. Revisa su estado actualizado antes de continuar.' : error.status === 0 ? 'No pudimos confirmar el resultado. Consultamos el estado actual; revisa antes de volver a actuar.' : this.message(error, 'La operación no pudo completarse. Revisa el estado actual.'));
      this.loadDetail(); this.refresh();
    } });
  }
  private message(error: { status?: number }, fallback: string) { return error.status === 403 ? 'No tienes permiso para esta operación.' : error.status === 401 ? 'Tu sesión ha vencido. Inicia sesión de nuevo.' : fallback; }
}
