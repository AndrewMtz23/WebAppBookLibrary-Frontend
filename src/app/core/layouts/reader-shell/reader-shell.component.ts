import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { WorkspaceShellComponent } from '../../../shared/ui/workspace-shell/workspace-shell.component';
import { readerNavigationForRole } from '../../navigation/navigation.config';
import { AuthService } from '../../services/auth.service';

@Component({ selector: 'app-reader-shell', standalone: true, imports: [WorkspaceShellComponent], template: `<app-workspace-shell variant="reader" [navigation]="navigation" [username]="username" [workspaceRoute]="workspaceRoute" contextLabel="Área de lectura" (logoutRequested)="logout()" />`, changeDetection: ChangeDetectionStrategy.OnPush })
export class ReaderShellComponent {
  get navigation() { return readerNavigationForRole(this.auth.sessionSnapshot?.user.role ?? 'user'); }
  get username(): string { return this.auth.sessionSnapshot?.user.username ?? 'Lector'; }
  get workspaceRoute(): readonly string[] | null {
    const role = this.auth.sessionSnapshot?.user.role;
    if (role === 'admin') return ['/admin/dashboard'];
    if (role === 'librarian') return ['/librarian/dashboard'];
    return null;
  }
  constructor(private readonly auth: AuthService, private readonly router: Router) {}
  logout(): void {
    this.auth.logout();
    setTimeout(() => void this.router.navigate(['/auth/login']), 650);
  }
}
