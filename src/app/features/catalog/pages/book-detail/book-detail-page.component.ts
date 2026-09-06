import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap, take } from 'rxjs';
import { BookDetail, BookSummary } from '../../../../shared/models/book.model';
import { ErrorStateComponent } from '../../../../shared/ui/error-state/error-state.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { FavoritesFacade } from '../../../reader/data-access/favorites.facade';
import { ReservationsFacade } from '../../../reader/data-access/reservations.facade';
import { RelatedBooksComponent } from '../../components/related-books/related-books.component';
import { CatalogService } from '../../data-access/catalog.service';
import { DEFAULT_CATALOG_QUERY } from '../../models/catalog-query';
import { ReaderAnalyticsService } from '../../../../core/analytics/reader-analytics.service';

@Component({
  selector: 'app-book-detail-page', standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, ErrorStateComponent, SkeletonComponent, RelatedBooksComponent],
  templateUrl: './book-detail-page.component.html', styleUrl: './book-detail-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly destroyRef = inject(DestroyRef);
  readonly reservations = inject(ReservationsFacade);
  readonly favorites = inject(FavoritesFacade);
  private readonly analytics = inject(ReaderAnalyticsService);
  readonly book = signal<BookDetail | null>(null);
  readonly related = signal<readonly BookSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() { this.load(); }

  retry(): void { this.load(); }
  reserve(bookId: string): void { this.analytics.trackAction('reservation'); this.reservations.reserve(bookId); }
  toggleFavorite(book: BookSummary): void { this.analytics.trackAction('favorite'); this.favorites.toggle(book); }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.route.paramMap.pipe(
      take(1),
      switchMap(params => this.catalog.getById(params.get('bookId') ?? '')),
      catchError(() => {
        this.error.set('No pudimos cargar la ficha de este libro.');
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(book => {
      this.book.set(book);
      if (book) this.analytics.trackAction('book_open');
      this.loading.set(false);
      if (book?.genres[0]) this.loadRelated(book);
    });
  }

  private loadRelated(book: BookDetail): void {
    this.catalog.search({ ...DEFAULT_CATALOG_QUERY, genre: book.genres[0], pageSize: 5 }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: page => this.related.set(page.items.filter(item => item.id !== book.id).slice(0, 4)), error: () => this.related.set([]) });
  }
}
