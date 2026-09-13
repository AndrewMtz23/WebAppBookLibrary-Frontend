import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { BookGridComponent } from '../../../catalog/components/book-grid/book-grid.component';
import { FeaturedBookComponent } from '../../../catalog/components/featured-book/featured-book.component';
import { ErrorStateComponent } from '../../../../shared/ui/error-state/error-state.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { DiscoverFacade } from '../../data-access/discover.facade';
import { FavoritesFacade } from '../../data-access/favorites.facade';

@Component({
  selector: 'app-discover-page', standalone: true,
  providers: [DiscoverFacade],
  imports: [RouterLink, BookGridComponent, FeaturedBookComponent, ErrorStateComponent, SkeletonComponent],
  templateUrl: './discover-page.component.html', styleUrl: './discover-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscoverPageComponent {
  readonly facade = inject(DiscoverFacade);
  readonly favorites = inject(FavoritesFacade);
  private readonly auth = inject(AuthService);
  readonly favoriteResolver = (book: import('../../../../shared/models/book.model').BookSummary): boolean => this.favorites.isFavorite(book);
  get isReader(): boolean { return this.auth.sessionSnapshot?.user.role === 'user'; }
  categoryOrdinal(index: number): string { return String(index + 1).padStart(2, '0'); }
}
