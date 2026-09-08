import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({ selector: 'app-skeleton', standalone: true, templateUrl: './skeleton.component.html', styleUrl: './skeleton.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class SkeletonComponent {
  @Input() lines = 3;
  get lineItems(): readonly number[] { return Array.from({ length: Math.max(1, this.lines) }, (_, index) => index); }
}
