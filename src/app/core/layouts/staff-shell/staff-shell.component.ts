import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { WorkspaceShellComponent } from '../../../shared/ui/workspace-shell/workspace-shell.component';
import { UserRole } from '../../auth/auth-session.model';
import { navigationForRole, navigationGroupsForRole } from '../../navigation/navigation.config';
import { AuthService } from '../../services/auth.service';

@Component({ selector: 'app-staff-shell', standalone: true, imports: [WorkspaceShellComponent], template: `<app-workspace-shell [navigation]="navigation" [navigationGroups]="navigationGroups" [username]="username" [avatarUrl]="avatarUrl" [contextLabel]="contextLabel" (logoutRequested)="logout()" />`, changeDetection: ChangeDetectionStrategy.OnPush })
export class StaffShellComponent {
  get role(): UserRole { return this.auth.sessionSnapshot?.user.role ?? 'librarian'; }
  get navigation() { return navigationForRole(this.role); }
  get navigationGroups() { return navigationGroupsForRole(this.role); }
  get username(): string { return this.auth.sessionSnapshot?.user.username ?? 'Personal'; }
  get avatarUrl(): string | null { return this.auth.sessionSnapshot?.user.avatarUrl ?? null; }
  get contextLabel(): string { return this.role === 'admin' ? 'Administración' : 'Operación bibliotecaria'; }
  constructor(private readonly auth: AuthService, private readonly router: Router) {}
  logout(): void {
    this.auth.logout();
    setTimeout(() => void this.router.navigate(['/auth/login']), 650);
  }
}
