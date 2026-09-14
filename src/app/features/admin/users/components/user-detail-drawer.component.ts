import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AdminUser, UpdateAdminUserRequest } from '../data-access/admin-users.models';

@Component({
  selector: 'app-user-detail-drawer',
  standalone: true,
  imports: [A11yModule, FormsModule, MatIconModule],
  template: `
    <div class="overlay overlay--editor" (mousedown)="closeFromBackdrop($event)">
      <section class="user-editor-modal" role="dialog" aria-modal="true" aria-labelledby="user-editor-title"
        cdkTrapFocus [cdkTrapFocusAutoCapture]="true" (keydown.escape)="requestClose()">
        <header class="editor-header">
          <div class="editor-heading">
            <span class="initial initial--large" aria-hidden="true">
              {{ initial }}
              @if (previewUrl && !avatarFailed) {
                <img class="user-avatar" [src]="previewUrl" alt="" (error)="avatarFailed = true">
              }
            </span>
            <div>
              <p class="eyebrow">Edición administrativa</p>
              <h2 id="user-editor-title">Actualizar usuario</h2>
              <p>Administra su identidad, foto y permisos desde un solo formulario.</p>
            </div>
          </div>
          <button cdkFocusInitial class="icon-button" type="button" aria-label="Cerrar detalle" (click)="requestClose()" [disabled]="busy">
            <mat-icon aria-hidden="true">close</mat-icon>
          </button>
        </header>

        @if (loading) {
          <div class="editor-loading" role="status"><span class="spinner" aria-hidden="true"></span>Consultando la cuenta…</div>
        } @else if (error) {
          <div class="error editor-error" role="alert"><p>{{ error }}</p><button type="button" (click)="retry.emit()">Reintentar consulta</button></div>
        } @else if (user) {
          <form #editorForm="ngForm" class="editor-layout" (ngSubmit)="submit(editorForm)">
            <aside class="editor-summary">
              <p class="eyebrow">Cuenta seleccionada</p>
              <h3>{{ draft.displayName || draft.username }}</h3>
              <p class="summary-handle">@{{ draft.username }}</p>
              <dl>
                <div><dt>Registro</dt><dd>{{ date(user.createdAt) }}</dd></div>
                <div><dt>Último acceso</dt><dd>{{ date(user.lastLoginAt) }}</dd></div>
                <div><dt>Estado</dt><dd><span class="badge" [class.inactive]="!draft.isActive">{{ draft.isActive ? 'Activa' : 'Inactiva' }}</span></dd></div>
              </dl>
              <div class="photo-note">
                <mat-icon aria-hidden="true">link</mat-icon>
                <p>La foto se obtiene desde la URL indicada. BookLibrary no almacena el archivo.</p>
              </div>
              @if (self) {
                <p class="self-note">Esta es tu cuenta. El usuario, el rol administrador y el acceso activo permanecen protegidos para conservar tu sesión.</p>
              }
            </aside>

            <div class="editor-form">
              <div class="section-heading">
                <p class="eyebrow">Identidad y acceso</p>
                <h3>Datos del usuario</h3>
                <p>Los cambios de nombre de usuario, rol o estado invalidan sesiones anteriores.</p>
              </div>

              <div class="editor-grid">
                <label>Nombre visible
                  <input name="displayName" [(ngModel)]="draft.displayName" required minlength="1" maxlength="120" autocomplete="off">
                </label>
                <label>Nombre de usuario
                  <input name="username" [(ngModel)]="draft.username" required minlength="3" maxlength="100" autocomplete="off" [disabled]="busy || self">
                </label>
                <label>Correo electrónico
                  <input type="email" name="email" [(ngModel)]="draft.email" required maxlength="254" autocomplete="off">
                </label>
                <label>Rol
                  <select name="role" [(ngModel)]="draft.role" [disabled]="busy || self">
                    <option value="user">Lector</option>
                    <option value="librarian">Bibliotecario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </label>
                <label class="avatar-field">URL de foto de perfil
                  <input type="url" name="avatarUrl" [(ngModel)]="draft.avatarUrl" maxlength="2048"
                    pattern="https?://.+" placeholder="https://ejemplo.com/foto.jpg"
                    (ngModelChange)="avatarFailed = false">
                  <span class="field-help">Acepta enlaces públicos con http o https. Déjalo vacío para usar iniciales.</span>
                </label>
              </div>

              <label class="status-control" [class.status-control--locked]="self">
                <span><strong>Cuenta activa</strong><small>Permite iniciar sesión y usar las funciones asignadas a su rol.</small></span>
                <input type="checkbox" name="isActive" [(ngModel)]="draft.isActive" [disabled]="busy || self">
              </label>

              @if (saveError) { <p class="editor-save-error" role="alert">{{ saveError }}</p> }

              <footer class="editor-actions">
                <p>{{ editorForm.dirty ? 'Hay cambios pendientes de guardar.' : 'Edita los campos que necesites.' }}</p>
                <div>
                  <button type="button" (click)="requestClose()" [disabled]="busy">Cancelar</button>
                  <button data-save-user class="primary" type="submit" [disabled]="busy || editorForm.invalid || !editorForm.dirty">
                    @if (busy) { <span class="spinner spinner--button" aria-hidden="true"></span>Guardando… } @else { <mat-icon aria-hidden="true">save</mat-icon>Actualizar usuario }
                  </button>
                </div>
              </footer>
            </div>
          </form>
        }
      </section>
    </div>
  `,
  styleUrl: './user-editor-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserDetailDrawerComponent {
  private currentUser: AdminUser | null = null;
  @Input() set user(value: AdminUser | null) {
    if (value && (value.id !== this.currentUser?.id || value.updatedAt !== this.currentUser.updatedAt)) {
      this.draft = {
        username: value.username,
        displayName: value.displayName,
        email: value.email,
        avatarUrl: value.avatarUrl ?? '',
        role: value.role,
        isActive: value.isActive,
        expectedUpdatedAt: value.updatedAt
      };
      this.avatarFailed = false;
      queueMicrotask(() => this.editorForm?.form.markAsPristine());
    }
    this.currentUser = value;
  }
  get user() { return this.currentUser; }
  @Input() loading = false;
  @Input() error = '';
  @Input() saveError = '';
  @Input() busy = false;
  @Input() self = false;
  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly retry = new EventEmitter<void>();
  @Output() readonly update = new EventEmitter<UpdateAdminUserRequest>();
  @ViewChild('editorForm') editorForm?: NgForm;

  avatarFailed = false;
  draft: UpdateAdminUserRequest & { avatarUrl: string | null } = {
    username: '', displayName: '', email: '', avatarUrl: '', role: 'user', isActive: true, expectedUpdatedAt: ''
  };

  get initial() { return (this.draft.displayName || this.draft.username || '?').trim().charAt(0).toUpperCase(); }
  get previewUrl() { return this.draft.avatarUrl?.trim() ?? ''; }
  date(value: string | null) { return value ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC' : 'Sin registro'; }
  requestClose() { if (!this.busy) this.close.emit(); }
  closeFromBackdrop(event: MouseEvent) { if (event.target === event.currentTarget) this.requestClose(); }
  submit(form: NgForm) {
    if (!this.user || this.busy || form.invalid || !form.dirty) return;
    this.update.emit({
      ...this.draft,
      username: this.draft.username.trim(),
      displayName: this.draft.displayName.trim(),
      email: this.draft.email.trim(),
      avatarUrl: this.previewUrl || null,
      role: this.self ? 'admin' : this.draft.role,
      isActive: this.self ? true : this.draft.isActive
    });
  }
}
