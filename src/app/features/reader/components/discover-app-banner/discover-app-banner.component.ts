import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BookSummary } from '../../../../shared/models/book.model';

@Component({
  selector: 'app-discover-app-banner',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './discover-app-banner.component.html',
  styleUrl: './discover-app-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscoverAppBannerComponent {
  @Input() isReader = true;
  @Input() book: BookSummary | null = null;
  @Input() hasActiveLoan = false;

  imageFailed = false;

  markImageFailed(): void {
    this.imageFailed = true;
  }
}
