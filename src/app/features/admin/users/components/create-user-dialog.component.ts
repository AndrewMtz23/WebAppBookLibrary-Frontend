import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, HostListener, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AdminUsersApi } from '../data-access/admin-users.api';
import { AdminUser } from '../data-access/admin-users.models';
import { OperationNotificationService } from '../../../../core/services/operation-notification.service';

@Component({
  selector: 'app-create-user-dialog', standalone: true,
  imports: [A11yModule, FormsModule, MatIconModule],
  styleUrls: ['./user-editor-modal.scss'],
  styles: [`.user-editor-modal { max-width: 38rem; } form { padding: 1.5rem; } .create-fields { display: grid; gap: 1rem; border: 0; padding: 0; margin: 0; } .create-fields label { display: grid; gap: .4rem; } .create-fields input, .create-fields select { width: 100%; min-height: 44px; box-sizing: border-box; border: 1px solid var(--color-border-strong); border-radius: .6rem; padding: .7rem; background: var(--color-surface); color: var(--color-text); font: inherit; } .create-actions { display: flex; justify-content: flex-end; gap: .6rem; margin-top: 1.5rem; } .create-help { color: var(--color-text-muted); font-size: .8rem; }`],
  template: `
    <div class="overlay">
      <section class="user-editor-modal" role="dialog" aria-modal="true" aria-labelledby="create-user-title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true" [attr.aria-busy]="busy()">
        <header class="editor-header"><div class="editor-heading"><mat-icon aria-hidden="true">person_add</mat-icon><h2 id="create-user-title">Agregar usuario</h2></div><button type="button" class="icon-button" aria-label="Cerrar formulario" [disabled]="busy()" (click)="dismiss()"><mat-icon aria-hidden="true">close</mat-icon></button></header>
        <form #form="ngForm" (ngSubmit)="submit(form)">
          <fieldset class="create-fields" [disabled]="busy()">
            <label>Nombre visible<input cdkFocusInitial name="displayName" [(ngModel)]="draft.displayName" required maxlength="120" autocomplete="off"></label>
            <label>Nombre de usuario<input name="username" [(ngModel)]="draft.username" required minlength="3" maxlength="100" autocomplete="off"></label>
            <label>Correo electrónico<input name="email" type="email" [(ngModel)]="draft.email" required email maxlength="254" autocomplete="off"></label>
            <label>Rol<select name="role" [(ngModel)]="draft.role"><option value="user">Lector</option><option value="librarian">Bibliotecario</option><option value="admin">Administrador</option></select></label>
            <label>Contraseña<input name="password" type="password" [(ngModel)]="draft.password" required minlength="8" maxlength="128" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,128}" autocomplete="new-password" aria-describedby="create-password-help"></label>
          </fieldset>
          <p id="create-password-help" class="create-help">Usa al menos 8 caracteres, con mayúscula, minúscula y número. La cuenta se creará activa.</p>
          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          <div class="create-actions"><button type="button" [disabled]="busy()" (click)="dismiss()">Cancelar</button><button class="primary" type="submit" [disabled]="busy() || form.invalid || !draft.displayName.trim() || draft.username.trim().length < 3">{{ busy() ? 'Creando…' : 'Crear usuario' }}</button></div>
        </form>
      </section>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateUserDialogComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();
  private readonly api = inject(AdminUsersApi);
  private readonly notifications = inject(OperationNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly error = signal('');
  draft = { username: '', displayName: '', email: '', password: '', role: 'user' as AdminUser['role'] };
  @HostListener('document:keydown.escape') dismiss() { if (!this.busy()) { this.draft.password = ''; this.closed.emit(); } }
  submit(form: NgForm) {
    if (this.busy() || form.invalid || !this.draft.displayName.trim() || this.draft.username.trim().length < 3) return;
    this.busy.set(true); this.error.set('');
    this.api.create({ ...this.draft, username: this.draft.username.trim(), displayName: this.draft.displayName.trim(), email: this.draft.email.trim() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.draft.password = ''; this.busy.set(false); this.notifications.success('Usuario creado correctamente.'); this.created.emit(); },
      error: error => { this.busy.set(false); this.error.set(error.status === 409 ? 'El nombre de usuario o correo ya está registrado.' : 'No pudimos crear la cuenta. Revisa los datos e intenta de nuevo.'); this.notifications.error(this.error()); }
    });
  }
}
