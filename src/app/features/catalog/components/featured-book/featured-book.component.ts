import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
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
export class FeaturedBookComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);

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
    this.startAutoAdvance();
  }

  ngOnDestroy(): void {
    this.stopAutoAdvance();
  }

  next(): void {
    const total = this.effectiveBooks.length;
    if (total <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % total;
    this.cdr.markForCheck();
  }

  prev(): void {
    const total = this.effectiveBooks.length;
    if (total <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + total) % total;
    this.cdr.markForCheck();
  }

  goTo(index: number): void {
    if (index >= 0 && index < this.effectiveBooks.length) {
      this.currentIndex = index;
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
      if (!this.isPaused && this.effectiveBooks.length > 1) {
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
