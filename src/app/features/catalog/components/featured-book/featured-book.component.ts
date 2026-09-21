import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CatalogService } from '../../data-access/catalog.service';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { BookSummary } from '../../../../shared/models/book.model';

interface StackedCard {
  readonly book: BookSummary;
  readonly offset: number;
}

@Component({
  selector: 'app-featured-book',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './featured-book.component.html',
  styleUrl: './featured-book.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturedBookComponent implements OnChanges, OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly catalog = inject(CatalogService);
  private detailRequest?: Subscription;
  private descriptionId: string | null = null;
  private readonly descriptions = new Map<string, string>();
  description = '';
  @Input() showFavorite = false;
  @Input() favoriteResolver: (book: BookSummary) => boolean = book => book.isFavorite;
  @Input() busyFavoriteIds: ReadonlySet<string> = new Set();
  @Output() readonly favoriteRequested = new EventEmitter<BookSummary>();
  focused = false;
  autoPaused = false;

  @Input() set book(value: BookSummary | undefined) {
    this._singleBook = value;
    if (value && this.books.length === 0) {
      this.currentIndex = 0;
    }
  }
  get book(): BookSummary {
    return this.currentBook ?? this._singleBook!;
  }

  @Input() books: readonly BookSummary[] = [];

  private _singleBook?: BookSummary;
  currentIndex = 0;
  private autoTimer: ReturnType<typeof setInterval> | null = null;
  private isPaused = false;
  readonly failedImageIds = new Set<string>();

  get effectiveBooks(): readonly BookSummary[] {
    if (this.books && this.books.length > 0) return this.books;
    return this._singleBook ? [this._singleBook] : [];
  }

  get currentBook(): BookSummary | null {
    const list = this.effectiveBooks;
    if (!list.length) return null;
    return list[this.currentIndex] ?? list[0];
  }

  get stackedCards(): readonly StackedCard[] {
    const list = this.effectiveBooks;
    if (!list.length) return [];
    const count = Math.min(3, list.length);
    const cards: StackedCard[] = [];
    for (let i = 0; i < count; i++) {
      const idx = (this.currentIndex + i) % list.length;
      cards.push({ book: list[idx], offset: i });
    }
    return cards;
  }

  ngOnInit(): void {
    this.autoPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.loadDescription();
    this.startAutoAdvance();
  }

  ngOnChanges(): void {
    if (this.currentIndex >= this.effectiveBooks.length) this.currentIndex = 0;
    this.loadDescription();
  }

  private loadDescription(): void {
    const id = this.currentBook?.id ?? null;
    if (id === this.descriptionId) return;
    this.descriptionId = id;
    this.detailRequest?.unsubscribe();
    this.description = id ? this.descriptions.get(id) ?? '' : '';
    if (!id || this.descriptions.has(id)) return;
    this.detailRequest = this.catalog.getById(id).subscribe({
      next: book => {
        this.descriptions.set(id, book.description);
        if (this.currentBook?.id === id) {
          this.description = book.description;
          this.cdr.markForCheck();
        }
      },
      error: () => { this.cdr.markForCheck(); }
    });
  }

  onFocusOut(event: FocusEvent): void {
    this.focused = !!event.relatedTarget && (event.currentTarget as HTMLElement).contains(event.relatedTarget as Node);
  }

  ngOnDestroy(): void {
    this.stopAutoAdvance();
    this.detailRequest?.unsubscribe();
  }

  next(): void {
    const total = this.effectiveBooks.length;
    if (total <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % total;
    this.loadDescription();
    this.cdr.markForCheck();
  }

  prev(): void {
    const total = this.effectiveBooks.length;
    if (total <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + total) % total;
    this.loadDescription();
    this.cdr.markForCheck();
  }

  goTo(index: number): void {
    if (index >= 0 && index < this.effectiveBooks.length) {
      this.currentIndex = index;
      this.loadDescription();
      this.cdr.markForCheck();
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  markImageFailed(id: string): void {
    this.failedImageIds.add(id);
    this.cdr.markForCheck();
  }

  private startAutoAdvance(): void {
    this.stopAutoAdvance();
    this.autoTimer = setInterval(() => {
      if (!this.isPaused && !this.focused && !this.autoPaused && !document.hidden && this.effectiveBooks.length > 1) {
        this.next();
      }
    }, 5500);
  }

  private stopAutoAdvance(): void {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }
}
