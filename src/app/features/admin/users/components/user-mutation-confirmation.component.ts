import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ROLE_LABELS, UserMutation, roleConsequence } from '../data-access/admin-users.models';

@Component({
  selector: 'app-user-mutation-confirmation',
  standalone: true,
  imports: [A11yModule],
  template: `
    <div class="overlay overlay--confirmation">
      <section class="confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby="user-confirmation-title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true" (keydown.escape)="cancel.emit()">
        <p class="eyebrow">Confirmación explícita</p>
        <h2 id="user-confirmation-title">{{ title }}</h2>
        <p>Cuenta: <strong>{{ mutation.user.displayName || mutation.user.username }}</strong> <span class="muted">@{{ mutation.user.username }}</span></p>
        <p>Estado actual del servidor: <strong>{{ ROLE_LABELS[mutation.user.role] }}</strong> · {{ mutation.user.isActive ? 'activa' : 'inactiva' }}.</p>
        @if (notice) { <p class="notice" role="status">{{ notice }}</p> }
        @if (reconciling) { <p class="notice" role="status">Consultando el estado actual antes de permitir otro intento…</p> }
        @if (reconciliationError) { <p class="error" role="alert">{{ reconciliationError }}</p><button data-reconcile-retry cdkFocusInitial type="button" (click)="retry.emit()" [disabled]="busy || reconciling">Consultar de nuevo</button> }
        <p>{{ consequence }}</p>
        <div class="actions">
          @if (reconciling || reconciliationError) {
            <button data-confirm type="button" class="primary" (click)="confirm.emit()" [disabled]="busy || reconciling || !!reconciliationError">{{ busy ? 'Procesando…' : confirmationLabel }}</button>
          } @else {
            <button data-confirm cdkFocusInitial type="button" class="primary" (click)="confirm.emit()" [disabled]="busy">{{ busy ? 'Procesando…' : confirmationLabel }}</button>
          }
          @if (reconciling && !reconciliationError) {
            <button data-cancel cdkFocusInitial type="button" (click)="cancel.emit()" [disabled]="busy">Volver sin cambios</button>
          } @else {
            <button data-cancel type="button" (click)="cancel.emit()" [disabled]="busy">Volver sin cambios</button>
          }
        </div>
      </section>
    </div>
  `,
  styleUrl: './admin-users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserMutationConfirmationComponent {
  @Input({ required: true }) mutation!: UserMutation;
  @Input() busy = false;
  @Input() notice = '';
  @Input() reconciling = false;
  @Input() reconciliationError = '';
  @Output() readonly confirm = new EventEmitter<void>();
  @Output() readonly cancel = new EventEmitter<void>();
  @Output() readonly retry = new EventEmitter<void>();
  readonly ROLE_LABELS = ROLE_LABELS;
  get title() { return this.mutation.type === 'role' ? `Cambiar rol a ${ROLE_LABELS[this.mutation.nextRole]}` : this.mutation.nextActive ? 'Activar cuenta' : 'Desactivar cuenta'; }
  get consequence() {
    if (this.mutation.type === 'role') return roleConsequence(this.mutation.user.role, this.mutation.nextRole);
    return this.mutation.nextActive ? 'La cuenta recuperará el acceso correspondiente a su rol actual.' : 'Se retirará todo acceso de esta cuenta y su sesión anterior dejará de ser válida.';
  }
  get confirmationLabel() { return this.mutation.type === 'role' ? `Confirmar rol ${ROLE_LABELS[this.mutation.nextRole]}` : this.mutation.nextActive ? 'Confirmar activación' : 'Confirmar desactivación'; }
}
