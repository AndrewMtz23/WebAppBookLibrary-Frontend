import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';
import { SignInRequiredDialogComponent } from '../../shared/ui/sign-in-required-dialog/sign-in-required-dialog.component';

export type ReaderAction = 'reserve' | 'favorite';

@Injectable({ providedIn: 'root' })
export class ReaderActionAccessService {
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notices = inject(MatSnackBar);
  private prompt: MatDialogRef<SignInRequiredDialogComponent> | null = null;

  ensureReader(action: ReaderAction, bookId: string): boolean {
    if (this.auth.isLoggedIn()) {
      if (this.auth.sessionSnapshot?.user.role === 'user') return true;
      this.notices.open('Las reservas y favoritos están disponibles para cuentas de lector.', 'Cerrar', { duration: 4500 });
      return false;
    }
    if (!this.prompt) {
      this.prompt = this.dialog.open(SignInRequiredDialogComponent, {
        data: { action, returnUrl: `/app/catalog/${encodeURIComponent(bookId)}` },
        width: '440px', maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100dvh - 2rem)',
        autoFocus: 'first-tabbable', delayFocusTrap: false, restoreFocus: true, closeOnNavigation: true,
        ariaLabelledBy: 'sign-in-required-title', ariaDescribedBy: 'sign-in-required-description'
      });
      this.prompt.afterClosed().subscribe(() => { this.prompt = null; });
    }
    return false;
  }
}
