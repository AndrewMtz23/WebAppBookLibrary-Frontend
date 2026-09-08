import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { BookGridComponent } from '../../../catalog/components/book-grid/book-grid.component';
import { CatalogService } from '../../../catalog/data-access/catalog.service';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/ui/error-state/error-state.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { FavoritesFacade } from '../../data-access/favorites.facade';

@Component({
  selector: 'app-favorites-page', standalone: true,
  imports: [MatButtonModule, BookGridComponent, EmptyStateComponent, ErrorStateComponent, PageHeaderComponent, SkeletonComponent],
  templateUrl: './favorites-page.component.html', styleUrl: './favorites-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesPageComponent {
  readonly facade = inject(FavoritesFacade);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);

  constructor() { this.facade.load(this.catalog); }
  load(page = 1): void { this.facade.load(this.catalog, page); }
  explore(): void { void this.router.navigate(['/app/catalog']); }
}
