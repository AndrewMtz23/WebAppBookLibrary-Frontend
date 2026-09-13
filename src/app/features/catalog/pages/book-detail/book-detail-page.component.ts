import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, Subscription, catchError, combineLatest, distinctUntilChanged, map, of, startWith, switchMap, tap } from 'rxjs';
import { BookDetail, BookSummary } from '../../../../shared/models/book.model';
import { ErrorStateComponent } from '../../../../shared/ui/error-state/error-state.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { FavoritesFacade } from '../../../reader/data-access/favorites.facade';
import { ReservationsFacade } from '../../../reader/data-access/reservations.facade';
import { RelatedBooksComponent } from '../../components/related-books/related-books.component';
import { CatalogService } from '../../data-access/catalog.service';
import { DEFAULT_CATALOG_QUERY } from '../../models/catalog-query';
import { ReaderAnalyticsService } from '../../../../core/analytics/reader-analytics.service';
import { ReaderService } from '../../../reader/data-access/reader.service';
import { PublicationDatePipe } from './publication-date.pipe';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-book-detail-page', standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, ErrorStateComponent, SkeletonComponent, RelatedBooksComponent, PublicationDatePipe],
  templateUrl: './book-detail-page.component.html', styleUrl: './book-detail-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly destroyRef = inject(DestroyRef);
  readonly reservations = inject(ReservationsFacade);
  readonly favorites = inject(FavoritesFacade);
  private readonly analytics = inject(ReaderAnalyticsService);
  private readonly reader = inject(ReaderService);
  private readonly auth = inject(AuthService);
  private readonly retryRequest = new Subject<void>();
  private reservationStateSubscription?: Subscription;
  readonly book = signal<BookDetail | null>(null);
  readonly related = signal<readonly BookSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activeDigital = signal(false);
  readonly activePhysical = signal(false);
  readonly imageFailed = signal(false);
  readonly digitalMessage = signal<string | null>(null);
  readonly favoriteResolver = (book: BookSummary): boolean => this.favorites.isFavorite(book);
  get isReader(): boolean { return this.auth.sessionSnapshot?.user.role === 'user'; }

  constructor() {
    this.reservations.confirmed$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(bookId => {
      if (this.book()?.id === bookId) this.retry();
    });
    combineLatest([
      this.route.paramMap.pipe(map(params => params.get('bookId') ?? ''), distinctUntilChanged()),
      this.retryRequest.pipe(startWith(undefined))
    ]).pipe(
      tap(([id]) => {
        this.reservationStateSubscription?.unsubscribe();
        if (this.book()?.id !== id) {
          this.reservations.resetFeedback();
          this.digitalMessage.set(null);
          this.imageFailed.set(false);
          this.activeDigital.set(false);
          this.activePhysical.set(false);
        }
        this.loading.set(true); this.error.set(null); this.related.set([]);
      }),
      switchMap(([bookId]) => this.catalog.getById(bookId).pipe(catchError(() => {
        this.error.set('No pudimos cargar la ficha de este libro.');
        return of(null);
      }))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(book => {
      this.book.set(book);
      if (book) this.analytics.trackAction('book_open');
      this.loading.set(false);
      if (book?.genres[0]) this.loadRelated(book);
      if (book && this.isReader) this.loadReservationState(book);
    });
  }

  retry(): void { this.retryRequest.next(); }
  reserve(bookId: string): void { this.analytics.trackAction('reservation'); this.reservations.reserve(bookId); }
  toggleFavorite(book: BookSummary): void { this.analytics.trackAction('favorite'); this.favorites.toggle(book); }
  openDigital(bookId: string): void {
    this.analytics.trackAction('digital_open');
    this.reader.getDigitalAccess(bookId).subscribe({
      next: access => {
        try {
          const url = new URL(access.resourceUrl);
          if (url.protocol !== 'https:') throw new Error('unsafe');
          window.open(url.href, '_blank', 'noopener,noreferrer');
        } catch { this.digitalMessage.set('El recurso no tiene una dirección HTTPS segura.'); }
      },
      error: () => this.digitalMessage.set('Tu acceso digital ya no está disponible. Revisa Mi biblioteca.')
    });
  }

  private loadRelated(book: BookDetail): void {
    this.catalog.search({ ...DEFAULT_CATALOG_QUERY, genre: book.genres[0], pageSize: 5 }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: page => this.related.set(page.items.filter(item => item.id !== book.id).slice(0, 4)), error: () => this.related.set([]) });
  }

  private loadReservationState(book: BookDetail): void {
    const bookId = book.id;
    this.reservationStateSubscription = this.reader.getLoans({ status: 'active', mediaType: book.mediaType, bookId, page: 1, pageSize: 1 }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          if (this.book()?.id !== bookId) return;
          this.activeDigital.set(book.mediaType === 'digital' && page.items.length > 0);
          this.activePhysical.set(book.mediaType === 'physical' && page.items.length > 0);
        },
        error: () => { if (this.book()?.id === bookId) this.digitalMessage.set('No pudimos comprobar tus reservas. Revisa Mi biblioteca.'); }
      });
  }
}
