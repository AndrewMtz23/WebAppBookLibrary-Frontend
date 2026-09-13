import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WorkspaceShellComponent } from '../../../shared/ui/workspace-shell/workspace-shell.component';
import { readerNavigationForRole } from '../../navigation/navigation.config';
import { AuthService } from '../../services/auth.service';

@Component({ selector: 'app-reader-shell', standalone: true, imports: [WorkspaceShellComponent], template: `<app-workspace-shell variant="reader" [navigation]="navigation" [username]="username" contextLabel="Área de lectura" />`, changeDetection: ChangeDetectionStrategy.OnPush })
export class ReaderShellComponent {
  get navigation() { return readerNavigationForRole(this.auth.sessionSnapshot?.user.role ?? 'user'); }
  get username(): string { return this.auth.sessionSnapshot?.user.username ?? 'Lector'; }
  constructor(private readonly auth: AuthService) {}
}
