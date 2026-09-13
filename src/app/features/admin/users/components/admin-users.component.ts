import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminUsersFacade } from '../data-access/admin-users.facade';
import { AdminUser, AdminUserQuery, DEFAULT_ADMIN_USER_QUERY, ROLE_LABELS } from '../data-access/admin-users.models';
import { UserDetailDrawerComponent } from './user-detail-drawer.component';
import { UserMutationConfirmationComponent } from './user-mutation-confirmation.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, UserDetailDrawerComponent, UserMutationConfirmationComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsersComponent {
  readonly vm = inject(AdminUsersFacade);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  readonly labels = ROLE_LABELS;
  draft = { ...DEFAULT_ADMIN_USER_QUERY };
  validation = '';
  private mutationOpener: HTMLElement | null = null;
  private hadPending = false;

  constructor() {
    effect(() => { this.draft = { ...this.vm.query() }; });
    effect(() => {
      const pending = !!this.vm.pending();
      if (this.hadPending && !pending) this.restoreMutationFocus();
      this.hadPending = pending;
    });
  }

  apply() {
    this.validation = this.invalidRange() ? 'La fecha inicial debe ser anterior a la fecha final.' : '';
    if (!this.validation) this.vm.filters(this.draft);
  }
  private invalidRange() { return this.after(this.draft.createdFrom, this.draft.createdTo) || this.after(this.draft.lastLoginFrom, this.draft.lastLoginTo); }
  private after(from: string, to: string) { return !!from && !!to && Date.parse(from) > Date.parse(to); }
  setDate(key: 'createdFrom' | 'createdTo' | 'lastLoginFrom' | 'lastLoginTo', value: string) { this.draft[key] = value ? new Date(value + 'Z').toISOString() : ''; }
  dateInput(value: string) { return value ? value.slice(0, 16) : ''; }
  date(value: string | null) { return value ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) : 'Sin registro'; }
  filtered() { const q = this.vm.query(); return ['query','role','isActive','createdFrom','createdTo','lastLoginFrom','lastLoginTo'].some(key => !!q[key as keyof AdminUserQuery]); }
  open(user: AdminUser, _event: Event) { this.vm.open(user.id); }
  close() {
    const id = this.vm.selectedId(); this.vm.close();
    afterNextRender(() => setTimeout(() => setTimeout(() => {
      const opener = Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('[data-user-id]')).find(button => button.dataset['userId'] === id && button.getClientRects().length > 0);
      (opener ?? this.host.nativeElement.querySelector<HTMLButtonElement>('[data-refresh]'))?.focus();
    })), { injector: this.injector });
  }
  role(user: AdminUser, nextRole: AdminUser['role']) { this.mutationOpener = document.activeElement as HTMLElement | null; this.vm.requestRole(user, nextRole); }
  status(user: AdminUser) { this.mutationOpener = document.activeElement as HTMLElement | null; this.vm.requestStatus(user); }
  cancelMutation() { this.vm.dismiss(); }
  private restoreMutationFocus() { afterNextRender(() => { const fallback = this.host.nativeElement.querySelector<HTMLElement>('[data-refresh]'); (this.mutationOpener?.isConnected ? this.mutationOpener : fallback)?.focus(); this.mutationOpener = null; }, { injector: this.injector }); }
}
