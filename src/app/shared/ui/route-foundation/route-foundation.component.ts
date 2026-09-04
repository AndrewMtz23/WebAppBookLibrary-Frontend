import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../page-header/page-header.component';
import { ActivatedRoute } from '@angular/router';

@Component({ selector: 'app-route-foundation', standalone: true, imports: [MatIconModule, PageHeaderComponent], templateUrl: './route-foundation.component.html', styleUrl: './route-foundation.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class RouteFoundationComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() eyebrow = 'Espacio de trabajo';
  constructor(private readonly route: ActivatedRoute) {}
  get resolvedTitle(): string { return this.title || this.route.snapshot.data['title'] || 'Próximamente'; }
  get resolvedDescription(): string { return this.description || this.route.snapshot.data['description'] || 'Esta sección está preparada para su siguiente etapa.'; }
  get resolvedEyebrow(): string { return this.route.snapshot.data['eyebrow'] || this.eyebrow; }
}
