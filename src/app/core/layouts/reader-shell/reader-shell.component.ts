import { toSignal } from '@angular/core/rxjs-interop';
import { inject } from '@angular/core';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { WorkspaceShellComponent } from '../../../shared/ui/workspace-shell/workspace-shell.component';
import { readerNavigationForRole } from '../../navigation/navigation.config';
import { AuthService } from '../../services/auth.service';

@Component({ selector: 'app-reader-shell', standalone: true, imports: [WorkspaceShellComponent], template: `<app-workspace-shell variant="reader" [navigation]="navigation" [guest]="!session()" [username]="username" [avatarUrl]="avatarUrl" contextLabel="Área de lectura" />`, changeDetection: ChangeDetectionStrategy.OnPush })
export class ReaderShellComponent {
  private readonly auth = inject(AuthService);
  readonly session = toSignal(this.auth.session$, { initialValue: this.auth.sessionSnapshot });
  get navigation() { return readerNavigationForRole(this.session()?.user.role ?? null); }
  get username(): string { return this.session()?.user.displayName || this.session()?.user.username || 'Lector'; }
  get avatarUrl(): string | null { return this.session()?.user.avatarUrl ?? null; }

}
