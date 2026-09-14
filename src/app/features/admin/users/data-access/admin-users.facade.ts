import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { PagedResult } from '../../../../shared/models/paged-result.model';
import { AdminUsersApi } from './admin-users.api';
import { AdminUser, AdminUserQuery, DEFAULT_ADMIN_USER_QUERY, UpdateAdminUserRequest, UserMutation, parseAdminUserQuery } from './admin-users.models';

@Injectable()
export class AdminUsersFacade {
  private readonly api = inject(AdminUsersApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly query = signal({ ...DEFAULT_ADMIN_USER_QUERY });
  readonly page = signal<PagedResult<AdminUser> | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly selectedId = signal<string | null>(null);
  readonly detail = signal<AdminUser | null>(null);
  readonly detailLoading = signal(false);
  readonly detailError = signal('');
  readonly editorError = signal('');
  readonly pending = signal<UserMutation | null>(null);
  readonly busy = signal(false);
  readonly reconciling = signal(false);
  readonly reconciliationError = signal('');
  private listRequest?: Subscription;
  private detailRequest?: Subscription;
  private reconciliationRequest?: Subscription;
  private mutationRequest?: Subscription;
  private requestGeneration = 0;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      this.query.set(parseAdminUserQuery(params));
      this.refresh();
      const pending = this.pending();
      if (pending && this.reconciling()) this.reconcile(pending.user.id);
    });
    this.destroyRef.onDestroy(() => { this.listRequest?.unsubscribe(); this.detailRequest?.unsubscribe(); this.reconciliationRequest?.unsubscribe(); this.mutationRequest?.unsubscribe(); });
  }

  filters(patch: Partial<AdminUserQuery>) { this.navigate({ ...this.query(), ...patch, page: 1 }); }
  paginate(page: number) { this.navigate({ ...this.query(), page }); }
  clear() { this.navigate({ ...DEFAULT_ADMIN_USER_QUERY }); }
  private navigate(query: AdminUserQuery) {
    void this.router.navigate([], { relativeTo: this.route, queryParams: Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '')) });
  }

  refresh() {
    const generation = ++this.requestGeneration;
    this.listRequest?.unsubscribe();
    this.loading.set(true); this.error.set('');
    this.listRequest = this.api.search(this.query()).subscribe({
      next: page => {
        if (generation !== this.requestGeneration) return;
        this.page.set(page); this.loading.set(false);
      },
      error: error => {
        if (generation !== this.requestGeneration) return;
        this.loading.set(false); this.error.set(this.message(error, 'No pudimos cargar las cuentas. Intenta actualizar.'));
      }
    });
  }

  open(id: string) { if (this.busy()) return; this.selectedId.set(id); this.notice.set(''); this.editorError.set(''); this.loadDetail(); }
  close() { if (this.busy()) return; this.detailRequest?.unsubscribe(); this.selectedId.set(null); this.detail.set(null); this.detailError.set(''); this.editorError.set(''); }
  reloadDetail() { if (!this.busy()) this.loadDetail(); }
  save(user: AdminUser, request: UpdateAdminUserRequest) {
    if (this.busy() || user.id !== this.selectedId()) return;
    this.mutationRequest?.unsubscribe();
    this.busy.set(true); this.error.set(''); this.editorError.set(''); this.notice.set('');
    this.mutationRequest = this.api.update(user.id, request).subscribe({
      next: updated => {
        this.busy.set(false);
        if (this.isSelf(updated)) this.auth.syncCurrentUser({
          id: updated.id, username: updated.username, email: updated.email, avatarUrl: updated.avatarUrl, role: updated.role
        });
        this.detail.set(updated);
        const page = this.page();
        if (page) this.page.set({ ...page, items: page.items.map(item => item.id === updated.id ? updated : item) });
        this.notice.set('Usuario actualizado. Los cambios de acceso se aplican desde la siguiente solicitud.');
        this.refresh();
      },
      error: error => {
        this.busy.set(false);
        this.editorError.set(error.status === 409
          ? 'No pudimos guardar: el usuario o correo ya existe, o la cuenta cambió en otra ventana. Vuelve a abrirla e intenta de nuevo.'
          : this.message(error, 'No pudimos actualizar el usuario. Revisa los datos e intenta de nuevo.'));
      }
    });
  }
  private loadDetail() {
    const id = this.selectedId(); if (!id) return;
    this.detailRequest?.unsubscribe(); this.detailLoading.set(true); this.detailError.set('');
    this.detailRequest = this.api.detail(id).subscribe({
      next: user => {
        if (this.selectedId() === id) {
          this.detail.set(user);
          const pending = this.pending();
          if (pending?.user.id === id) this.pending.set({ ...pending, user } as UserMutation);
        }
        this.detailLoading.set(false);
      },
      error: error => { this.detailLoading.set(false); this.detailError.set(this.message(error, error.status === 404 ? 'La cuenta ya no está disponible.' : 'No pudimos consultar la cuenta.')); }
    });
  }

  isSelf(user: AdminUser) { return user.id === this.auth.getUserId(); }
  requestRole(user: AdminUser, nextRole: AdminUser['role']) {
    if (this.busy() || nextRole === user.role || (this.isSelf(user) && nextRole !== 'admin')) return;
    this.pending.set({ type: 'role', user, nextRole });
  }
  requestStatus(user: AdminUser) {
    const nextActive = !user.isActive;
    if (this.busy() || (this.isSelf(user) && !nextActive)) return;
    this.pending.set({ type: 'status', user, nextActive });
  }
  dismiss() {
    if (!this.busy() && !this.reconciling()) {
      this.pending.set(null);
      this.reconciliationError.set('');
    }
  }

  retryReconciliation() {
    const command = this.pending();
    if (command && !this.busy() && !this.reconciling()) this.reconcile(command.user.id);
  }

  confirm() {
    const command = this.pending(); if (!command || this.busy() || this.reconciling() || this.reconciliationError()) return;
    this.busy.set(true); this.notice.set(''); this.error.set('');
    const request = command.type === 'role' ? this.api.setRole(command.user.id, command.nextRole) : this.api.setStatus(command.user.id, command.nextActive);
    this.mutationRequest = request.subscribe({
      next: () => {
        this.busy.set(false); this.pending.set(null); this.reconciling.set(false); this.reconciliationError.set('');
        this.notice.set(command.type === 'role' ? 'Rol actualizado. La sesión anterior de la cuenta dejó de ser válida.' : command.nextActive ? 'Cuenta activada.' : 'Cuenta desactivada y acceso retirado.');
        if (this.selectedId() === command.user.id) this.loadDetail();
        this.refresh();
      },
      error: error => {
        this.busy.set(false);
        if (this.requiresReconciliation(error.status)) {
          this.notice.set(error.status === 409 ? 'La cuenta cambió mientras trabajabas. Conservamos tu selección y consultamos el estado actual antes de otro intento.' : 'El resultado es incierto. Conservamos tu selección y consultamos el estado actual antes de otro intento.');
          this.reconcile(command.user.id);
        } else {
          this.error.set(this.message(error, 'No pudimos completar el cambio. Tu selección se conserva para reintentar.'));
        }
      }
    });
  }

  private requiresReconciliation(status: number | undefined) { return status === 0 || status === 409 || (status !== undefined && status >= 500); }

  private reconcile(id: string) {
    this.detailRequest?.unsubscribe();
    this.reconciliationRequest?.unsubscribe();
    this.listRequest?.unsubscribe();
    this.listRequest = undefined;
    const generation = ++this.requestGeneration;
    this.selectedId.set(id);
    this.reconciling.set(true);
    this.reconciliationError.set('');
    this.detailLoading.set(true);
    this.loading.set(true);
    this.reconciliationRequest = forkJoin({ detail: this.api.detail(id), page: this.api.search(this.query()) }).subscribe({
      next: ({ detail, page }) => {
        if (this.selectedId() === id) {
          this.detail.set(detail);
          const pending = this.pending();
          if (pending?.user.id === id) this.pending.set({ ...pending, user: detail } as UserMutation);
        }
        if (generation === this.requestGeneration) {
          this.page.set(page);
          this.loading.set(false);
        }
        this.detailLoading.set(false);
        this.reconciling.set(false);
      },
      error: error => {
        this.detailLoading.set(false);
        if (generation === this.requestGeneration) this.loading.set(false);
        this.reconciling.set(false);
        this.reconciliationError.set(this.message(error, 'No pudimos consultar el estado actual. Intenta consultar de nuevo antes de confirmar.'));
      }
    });
  }

  private message(error: { status?: number }, fallback: string) {
    return error.status === 403 ? 'No tienes permiso para administrar cuentas.' : error.status === 401 ? 'Tu sesión ya no es válida. Inicia sesión de nuevo.' : fallback;
  }
}
