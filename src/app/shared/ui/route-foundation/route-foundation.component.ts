import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../page-header/page-header.component';

@Component({ selector: 'app-route-foundation', standalone: true, imports: [MatIconModule, PageHeaderComponent], templateUrl: './route-foundation.component.html', styleUrl: './route-foundation.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class RouteFoundationComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';
  @Input() eyebrow = 'Espacio de trabajo';
}
