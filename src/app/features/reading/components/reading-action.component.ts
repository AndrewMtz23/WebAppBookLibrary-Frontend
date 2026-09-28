import { Component, ElementRef, Input, OnChanges, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { SessionScopeService } from '../../../core/auth/session-scope.service';
import { SignInRequiredDialogComponent } from '../../../shared/ui/sign-in-required-dialog/sign-in-required-dialog.component';
import { ReadingFacade } from '../data-access/reading.facade';
import { ReadingEditorComponent } from './reading-editor.component';

@Component({ selector: 'app-reading-action', standalone: true, imports: [ReadingEditorComponent], providers: [ReadingFacade],
  templateUrl: './reading-action.component.html', styleUrl: './reading-action.component.scss' })
export class ReadingActionComponent implements OnChanges {
  @Input({ required: true }) bookId = '';
  @Input() pageCount: number | null = null;
  readonly facade = inject(ReadingFacade);
  private readonly auth = inject(AuthService);
  private readonly dialogs = inject(MatDialog);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly opened = signal(false);
  private prompting = false;
  constructor() {
    this.facade.saved$.pipe(takeUntilDestroyed()).subscribe(() => this.close());
    inject(SessionScopeService).changed$.pipe(takeUntilDestroyed()).subscribe(() => this.opened.set(false));
  }
  ngOnChanges(): void { this.opened.set(false); this.facade.clear(); }
  open(): void {
    if (!this.auth.sessionSnapshot) {
      if (this.prompting) return;
      this.prompting = true;
      this.dialogs.open(SignInRequiredDialogComponent, { data: { action: 'reading', returnUrl: '/app/catalog/' + encodeURIComponent(this.bookId) }, width: '440px', maxWidth: 'calc(100vw - 2rem)', restoreFocus: true, closeOnNavigation: true,
        ariaLabelledBy: 'sign-in-required-title', ariaDescribedBy: 'sign-in-required-description' }).afterClosed().subscribe(() => this.prompting = false);
      return;
    }
    this.opened.set(true); this.reload();
  }
  reload(): void { this.facade.resetFeedback(); this.facade.load({ bookId: this.bookId }); }
  close(): void { this.opened.set(false); queueMicrotask(() => this.host.nativeElement.querySelector<HTMLButtonElement>('[data-open-reading]')?.focus()); }
}
