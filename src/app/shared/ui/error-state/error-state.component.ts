import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({ selector: 'app-error-state', standalone: true, imports: [MatButtonModule, MatIconModule], templateUrl: './error-state.component.html', styleUrl: './error-state.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class ErrorStateComponent {
  @Input() title = 'No pudimos cargar esta sección';
  @Input() message = 'Intenta nuevamente en unos momentos.';
  @Input() retryLabel = 'Reintentar';
  @Output() readonly retryRequested = new EventEmitter<void>();
}
