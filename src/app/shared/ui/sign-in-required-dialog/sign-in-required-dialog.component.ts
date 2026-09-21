import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import type { ReaderAction } from '../../../core/auth/reader-action-access.service';

@Component({
  selector: 'app-sign-in-required-dialog', standalone: true,
  imports: [MatDialogModule, RouterLink, MatIconModule],
  templateUrl: './sign-in-required-dialog.component.html',
  styleUrl: './sign-in-required-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignInRequiredDialogComponent {
  readonly data = inject<{ action: ReaderAction; returnUrl: string }>(MAT_DIALOG_DATA);
}
