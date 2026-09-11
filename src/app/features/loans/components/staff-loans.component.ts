import { Component, ElementRef, Injector, afterNextRender, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { StaffLoansFacade } from '../data-access/staff-loans.facade';
import { DEFAULT_STAFF_LOAN_QUERY } from '../data-access/staff-loans.models';
@Component({ selector: 'app-staff-loans', standalone: true, imports: [CommonModule, FormsModule, A11yModule], templateUrl: './staff-loans.component.html', styleUrl: './staff-loans.scss' })
export class StaffLoansComponent {
  readonly vm = inject(StaffLoansFacade); draft = { ...DEFAULT_STAFF_LOAN_QUERY }; validation = '';
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  readonly statuses: Record<string,string> = { active: 'Reservado', outstanding: 'Pendientes', overdue: 'Vencido', returned: 'Devuelto', cancelled: 'Cancelado' };
  readonly events: Record<string,string> = { created: 'Reserva', returned: 'Devolución', cancelled: 'Cancelación' };
  constructor() {
    effect(() => { this.draft = { ...this.vm.query() }; });
    effect(() => {
      const selected = this.vm.selectedId(); const pending = this.vm.pending();
      this.vm.detailLoading(); this.vm.busy();
      if (!selected) return;
      afterNextRender(() => {
        if (this.vm.selectedId() !== selected) return;
        const dialog = this.host.nativeElement.querySelector<HTMLElement>('[role="dialog"]');
        if (!dialog) return;
        const confirmation = pending ? dialog.querySelector<HTMLButtonElement>('.confirmation .primary') : null;
        if (confirmation && !confirmation.disabled) confirmation.focus();
        else if (!dialog.contains(document.activeElement)) dialog.querySelector<HTMLButtonElement>('[aria-label="Cerrar detalle"]')?.focus();
      }, { injector: this.injector });
    });
  }
  closeDetail() {
    if (this.vm.busy()) return;
    const id = this.vm.selectedId(); this.vm.close();
    afterNextRender(() => {
      if (this.vm.selectedId()) return;
      const opener = Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[data-loan-id]'))
        .find(button => button.dataset['loanId'] === id && button.getClientRects().length > 0);
      (opener ?? this.host.nativeElement.querySelector<HTMLButtonElement>('.toolbar button'))?.focus();
    }, { injector: this.injector });
  }
  apply() { this.validation = ''; if ((this.draft.from && this.draft.to && this.draft.from >= this.draft.to) || (this.draft.dueFrom && this.draft.dueTo && this.draft.dueFrom >= this.draft.dueTo)) { this.validation = 'El inicio debe ser anterior al final del intervalo.'; return; } this.vm.filters(this.draft); }
  dateInput(value: string) { return value ? value.slice(0,16) : ''; }
  setDate(key: 'from'|'to'|'dueFrom'|'dueTo', value: string) { this.draft[key] = value ? new Date(value + ':00Z').toISOString() : ''; }
  date(value: string | null) { return value ? new Intl.DateTimeFormat('es-MX', {dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(new Date(value)) + ' UTC' : '—'; }
  filtered() { const q = this.vm.query(); return !!(q.query || q.status || q.mediaType || q.userId || q.bookId || q.from || q.to || q.dueFrom || q.dueTo); }
}
