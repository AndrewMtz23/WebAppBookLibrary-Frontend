import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-discover-editorial',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './discover-editorial.component.html',
  styleUrl: './discover-editorial.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscoverEditorialComponent {}
