import { StaffPageHeaderComponent } from '../../../../shared/ui/staff-page-header/staff-page-header.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdminUsersComponent } from '../components/admin-users.component';
import { AdminUsersFacade } from '../data-access/admin-users.facade';

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [StaffPageHeaderComponent, AdminUsersComponent],
  providers: [AdminUsersFacade],
  template: `<app-staff-page-header icon="group" title="Control de usuarios" description="Administra las cuentas, sus roles y su acceso a la biblioteca."></app-staff-page-header><app-admin-users />`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPageComponent {}
