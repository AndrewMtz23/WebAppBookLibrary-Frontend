import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-staff-page-header', standalone: true, imports: [MatIconModule],
  template: `<header><div class="title"><mat-icon aria-hidden="true">{{ icon }}</mat-icon><h1>{{ title }}</h1></div><p>{{ description }}</p><div class="header-actions"><ng-content /></div></header>`,
  styles: [`
    :host { display: block; }
    header { display: block; padding: 0; margin: 0; border: 0; }
    .title { display: flex; align-items: center; gap: .8rem; }
    mat-icon { width: 2rem; height: 2rem; font-size: 2rem; color: var(--color-primary); flex: none; }
    h1 { margin: 0; font-family: var(--font-body); font-size: clamp(1.5rem, 2.2vw, 2rem); font-weight: 800; letter-spacing: -.035em; line-height: 1.2; }
    p { margin: .4rem 0 0; color: var(--color-text-muted); line-height: 1.6; }
    .header-actions { display: flex; justify-content: flex-end; gap: .6rem; flex-wrap: wrap; margin-top: .75rem; }
    .header-actions:empty { display: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StaffPageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input({ required: true }) icon = '';
}
