import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdminUsersComponent } from '../components/admin-users.component';
import { AdminUsersFacade } from '../data-access/admin-users.facade';

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [AdminUsersComponent],
  providers: [AdminUsersFacade],
  template: `<header><p class="eyebrow">Administración</p><h1>Usuarios</h1><p>Consulta identidades seguras y concede o retira acceso con una confirmación explícita.</p></header><app-admin-users />`,
  styleUrl: '../components/admin-users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPageComponent {}
