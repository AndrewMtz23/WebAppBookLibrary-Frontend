import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <button
      type="button"
      class="theme-toggle"
      [matTooltip]="theme.isDark() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      matTooltipPosition="below"
      [attr.aria-label]="theme.isDark() === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'"
      (click)="theme.toggle()">
      <mat-icon aria-hidden="true">{{ theme.isDark() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
    </button>
  `,
  styles: [`
    .theme-toggle {
      display: inline-grid;
      place-items: center;
      width: 2.4rem;
      height: 2.4rem;
      border: 1px solid var(--color-border);
      border-radius: 50%;
      background: var(--color-surface);
      color: var(--color-text-muted);
      cursor: pointer;
      transition: color var(--duration-fast) var(--ease-out),
                  border-color var(--duration-fast) var(--ease-out),
                  background var(--duration-fast) var(--ease-out),
                  transform var(--duration-fast) var(--ease-out);

      mat-icon {
        font-size: 1.15rem;
        width: 1.15rem;
        height: 1.15rem;
        transition: transform var(--duration-base) var(--ease-out);
      }

      &:hover {
        color: var(--color-primary);
        border-color: var(--color-primary);
        background: var(--color-primary-soft);
        transform: scale(1.08);

        mat-icon {
          transform: rotate(20deg);
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
