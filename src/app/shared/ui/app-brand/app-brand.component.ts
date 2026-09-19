import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './app-brand.component.html',
  styleUrl: './app-brand.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBrandComponent {
  @Input() compact = false;
  @Input() route: string | readonly string[] = '/';
}
