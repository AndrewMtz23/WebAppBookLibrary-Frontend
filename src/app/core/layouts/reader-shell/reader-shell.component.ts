import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { WorkspaceShellComponent } from '../../../shared/ui/workspace-shell/workspace-shell.component';
import { navigationForRole } from '../../navigation/navigation.config';
import { AuthService } from '../../services/auth.service';

@Component({ selector: 'app-reader-shell', standalone: true, imports: [WorkspaceShellComponent], template: `<app-workspace-shell [navigation]="navigation" [username]="username" contextLabel="Área de lectura" (logoutRequested)="logout()" />`, changeDetection: ChangeDetectionStrategy.OnPush })
export class ReaderShellComponent {
  readonly navigation = navigationForRole('user');
  get username(): string { return this.auth.sessionSnapshot?.user.username ?? 'Lector'; }
  constructor(private readonly auth: AuthService, private readonly router: Router) {}
  logout(): void {
    this.auth.logout();
    setTimeout(() => void this.router.navigate(['/auth/login']), 650);
  }
}
