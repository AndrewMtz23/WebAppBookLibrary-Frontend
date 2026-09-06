import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet, MatBottomSheetModule, MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BookFacet } from '../../../reader/models/reader.models';
import { FavoritesFacade } from '../../../reader/data-access/favorites.facade';
import { EmptyStateComponent } from '../../../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../shared/ui/error-state/error-state.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { BookGridComponent } from '../../components/book-grid/book-grid.component';
import { CatalogFiltersComponent } from '../../components/catalog-filters/catalog-filters.component';
import { CatalogSearchComponent } from '../../components/catalog-search/catalog-search.component';
import { CatalogFacade } from '../../data-access/catalog.facade';
import { CatalogService } from '../../data-access/catalog.service';
import { CatalogQuery } from '../../models/catalog-query';
import { ReaderAnalyticsService } from '../../../../core/analytics/reader-analytics.service';

interface FilterSheetData { query: CatalogQuery; facets: readonly BookFacet[]; }

@Component({
  standalone: true, imports: [CatalogFiltersComponent, MatButtonModule], template: `
    <div class="sheet">
      <app-catalog-filters [query]="query()" [facets]="data.facets" (queryChanged)="update($event)" (clearRequested)="ref.dismiss('clear')" />
      <div class="sheet__actions">
        <button mat-button type="button" (click)="ref.dismiss()">Cancelar</button>
        <button mat-flat-button type="button" (click)="apply()">Aplicar filtros</button>
      </div>
    </div>`,
  styles: [`.sheet{padding:1.25rem 1.25rem 2rem;max-height:80vh;overflow:auto}.sheet__actions{display:flex;justify-content:flex-end;gap:.5rem;padding-top:1rem;position:sticky;bottom:-2rem;background:var(--surface-raised)}`], changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogFiltersSheetComponent {
  readonly data = inject<FilterSheetData>(MAT_BOTTOM_SHEET_DATA);
  readonly ref = inject(MatBottomSheetRef<CatalogFiltersSheetComponent>);
  readonly query = signal(this.data.query);
  private pending: Partial<CatalogQuery> = {};

  update(patch: Partial<CatalogQuery>): void {
    this.pending = { ...this.pending, ...patch };
    this.query.update(current => ({ ...current, ...patch }));
  }

  apply(): void { this.ref.dismiss(this.pending); }
}

@Component({
  selector: 'app-catalog-page', standalone: true,
  imports: [MatBottomSheetModule, MatButtonModule, MatIconModule, PageHeaderComponent, CatalogSearchComponent, CatalogFiltersComponent, BookGridComponent, EmptyStateComponent, ErrorStateComponent, SkeletonComponent],
  templateUrl: './catalog-page.component.html', styleUrl: './catalog-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPageComponent {
  readonly facade = inject(CatalogFacade);
  readonly favorites = inject(FavoritesFacade);
  private readonly catalog = inject(CatalogService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly analytics = inject(ReaderAnalyticsService);
  readonly facets = signal<readonly BookFacet[]>([]);
  readonly favoriteResolver = (book: import('../../../../shared/models/book.model').BookSummary): boolean => this.favorites.isFavorite(book);
  @ViewChild('resultsHeading') private resultsHeading?: ElementRef<HTMLElement>;

  constructor() {
    this.catalog.getFacets().pipe(takeUntilDestroyed()).subscribe({ next: facets => this.facets.set(facets) });
  }

  search(value: string): void {
    this.analytics.trackSearch(value);
    const sort = value ? 'relevance' : this.facade.query().sort === 'relevance' ? 'createdAt' : this.facade.query().sort;
    void this.applyPatch({ query: value || null, sort, direction: 'desc' });
  }

  async applyPatch(patch: Partial<CatalogQuery>): Promise<void> {
    const filterKeys = Object.keys(patch).filter(key => key !== 'query' && key !== 'page');
    if (filterKeys.length) this.analytics.trackFilter(filterKeys);
    await this.facade.patchQuery(patch);
    queueMicrotask(() => this.resultsHeading?.nativeElement.focus());
  }

  trackBookOpen(): void { this.analytics.trackAction('book_open'); }

  openFilters(): void {
    this.bottomSheet.open(CatalogFiltersSheetComponent, { data: { query: this.facade.query(), facets: this.facets() } })
      .afterDismissed().subscribe(result => {
        if (result === 'clear') void this.facade.clearFilters();
        else if (result) void this.applyPatch(result);
      });
  }
}
