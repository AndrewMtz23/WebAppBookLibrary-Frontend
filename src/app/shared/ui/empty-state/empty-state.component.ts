import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({ selector: 'app-empty-state', standalone: true, imports: [MatButtonModule, MatIconModule], templateUrl: './empty-state.component.html', styleUrl: './empty-state.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class EmptyStateComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input() icon = 'auto_stories';
  @Input() actionLabel: string | null = null;
  @Output() readonly actionRequested = new EventEmitter<void>();
}
