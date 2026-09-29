import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NotificationState, Notice } from './notification-state';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessionScopeService } from '../../core/auth/session-scope.service';

@Component({ selector: 'app-notifications-page', standalone: true, imports: [DatePipe, RouterLink, MatIconModule],
  templateUrl: './notifications-page.component.html', styleUrl: './notifications-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class NotificationsPageComponent {
  readonly state = inject(NotificationState);
  readonly timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  constructor() {
    this.state.load(); this.state.loadPreferences();
    inject(SessionScopeService).changed$.pipe(takeUntilDestroyed()).subscribe(() => { this.state.load(); this.state.loadPreferences(); });
  }
  load(more = false): void { this.state.load(more); }
  target(notice: Notice): string[] | null { return notice.targetType === 'book' && /^[a-f0-9]{24}$/i.test(notice.targetId) ? ['/app/catalog', notice.targetId] : null; }
}
