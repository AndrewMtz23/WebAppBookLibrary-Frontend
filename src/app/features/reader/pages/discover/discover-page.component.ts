import { ReaderActionAccessService } from '../../../../core/auth/reader-action-access.service';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { BookGridComponent } from '../../../catalog/components/book-grid/book-grid.component';
import { FeaturedBookComponent } from '../../../catalog/components/featured-book/featured-book.component';
import { ErrorStateComponent } from '../../../../shared/ui/error-state/error-state.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { DiscoverFacade } from '../../data-access/discover.facade';
import { FavoritesFacade } from '../../data-access/favorites.facade';

import { DiscoverPathwaysComponent } from '../../components/discover-pathways/discover-pathways.component';
import { DiscoverEditorialComponent } from '../../components/discover-editorial/discover-editorial.component';
import { DiscoverAppBannerComponent } from '../../components/discover-app-banner/discover-app-banner.component';

@Component({
  selector: 'app-discover-page', standalone: true,
  providers: [DiscoverFacade],
  imports: [
    RouterLink,
    BookGridComponent,
    FeaturedBookComponent,
    ErrorStateComponent,
    SkeletonComponent,
    DiscoverPathwaysComponent,
    DiscoverEditorialComponent,
    DiscoverAppBannerComponent
  ],
  templateUrl: './discover-page.component.html', styleUrl: './discover-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscoverPageComponent {
  readonly facade = inject(DiscoverFacade);
  readonly bannerBooks = computed(() => {
    const active = this.facade.activeReading().data;
    return [...(active ? [active] : []), ...this.facade.popularBooks(), ...this.facade.newest().data];
  });
  readonly favorites = inject(FavoritesFacade);
  private readonly auth = inject(AuthService);
  private readonly actionAccess = inject(ReaderActionAccessService);
  get showReaderActions(): boolean { return !this.auth.sessionSnapshot || this.isReader; }
  readonly favoriteResolver = (book: import('../../../../shared/models/book.model').BookSummary): boolean => this.isReader && this.favorites.isFavorite(book);
  get heroBooks(): readonly import('../../../../shared/models/book.model').BookSummary[] {
    if (typeof this.facade.featuredHeroBooks === 'function') {
      return this.facade.featuredHeroBooks();
    }
    return this.facade.popularBooks?.() || this.facade.newest?.().data || [];
  }

  get digitalBooks(): readonly import('../../../../shared/models/book.model').BookSummary[] {
    if (typeof this.facade.digitalBooks === 'function') {
      return this.facade.digitalBooks();
    }
    return this.facade.newest?.().data?.filter(b => b.mediaType === 'digital') || [];
  }

  get physicalBooks(): readonly import('../../../../shared/models/book.model').BookSummary[] {
    if (typeof this.facade.physicalBooks === 'function') {
      return this.facade.physicalBooks();
    }
    return this.facade.newest?.().data?.filter(b => b.mediaType === 'physical') || [];
  }

  toggleFavorite(book: import('../../../../shared/models/book.model').BookSummary): void {
    if (this.actionAccess.ensureReader('favorite', book.id)) this.favorites.toggle(book);
  }
  get isReader(): boolean { return this.auth.sessionSnapshot?.user.role === 'user'; }
  categoryOrdinal(index: number): string { return String(index + 1).padStart(2, '0'); }
}
