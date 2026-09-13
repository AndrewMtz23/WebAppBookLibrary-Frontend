import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminUser, ROLE_LABELS } from '../data-access/admin-users.models';

@Component({
  selector: 'app-user-detail-drawer',
  standalone: true,
  imports: [A11yModule, FormsModule],
  template: `
    <div class="overlay">
      <section class="drawer" role="dialog" aria-modal="true" aria-labelledby="user-detail-title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true" (keydown.escape)="close.emit()">
        <header><div><p class="eyebrow">Cuenta segura</p><h2 id="user-detail-title">Detalle de usuario</h2></div><button cdkFocusInitial type="button" aria-label="Cerrar detalle" (click)="close.emit()" [disabled]="busy">Cerrar</button></header>
        @if (loading) { <p role="status">Consultando estado actual…</p> }
        @if (error) { <div class="error" role="alert"><p>{{ error }}</p><button type="button" (click)="retry.emit()">Reintentar consulta</button></div> }
        @if (user) {
          <div class="detail-identity"><span class="initial" aria-hidden="true">{{ initial }}</span><div><h3>{{ user.displayName || user.username }}</h3><p>@{{ user.username }} · {{ user.email }}</p></div></div>
          <dl><dt>Rol</dt><dd>{{ labels[user.role] }}</dd><dt>Estado</dt><dd><span class="badge" [class.inactive]="!user.isActive">{{ user.isActive ? 'Activa' : 'Inactiva' }}</span></dd><dt>Registro</dt><dd>{{ date(user.createdAt) }}</dd><dt>Último acceso</dt><dd>{{ date(user.lastLoginAt) }}</dd></dl>
          @if (self) { <p class="self-note">Esta es tu cuenta. La auto-democión y la auto-desactivación están deshabilitadas para evitar que pierdas acceso administrativo.</p> }
          <div class="management"><label>Nuevo rol<select [(ngModel)]="roleChoice" [disabled]="busy"><option value="user">Lector</option><option value="librarian">Bibliotecario</option><option value="admin">Administrador</option></select></label><button type="button" (click)="role.emit(roleChoice)" [disabled]="busy || roleChoice === user.role || (self && roleChoice !== 'admin')">Revisar cambio de rol</button></div>
          <button type="button" [class.danger]="user.isActive" (click)="status.emit()" [disabled]="busy || (self && user.isActive)">{{ user.isActive ? 'Revisar desactivación' : 'Revisar activación' }}</button>
        }
      </section>
    </div>
  `,
  styleUrl: './admin-users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDetailDrawerComponent {
  @Input() user: AdminUser | null = null;
  @Input() loading = false;
  @Input() error = '';
  @Input() busy = false;
  @Input() self = false;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly retry = new EventEmitter<void>();
  @Output() readonly role = new EventEmitter<AdminUser['role']>();
  @Output() readonly status = new EventEmitter<void>();
  readonly labels = ROLE_LABELS;
  roleChoice: AdminUser['role'] = 'user';
  @Input() set selectedRole(value: AdminUser['role'] | null) { if (value) this.roleChoice = value; }
  get initial() { return (this.user?.displayName || this.user?.username || '?').trim().charAt(0).toUpperCase(); }
  date(value: string | null) { return value ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC' : 'Sin registro'; }
}
