import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BookSummary } from '../../../../shared/models/book.model';
import { ReadingResponse } from '../../../reading/models/reading.models';

@Component({
  selector: 'app-discover-app-banner', standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './discover-app-banner.component.html',
  styleUrl: './discover-app-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscoverAppBannerComponent implements OnChanges, OnInit, OnDestroy {
  @Input() books: readonly BookSummary[] = [];
  @Input() reading: ReadingResponse | null = null;
  private readonly cdr = inject(ChangeDetectorRef);
  private timer: ReturnType<typeof setInterval> | null = null;
  private slides: BookSummary[] = [];
  private index = 0;
  hovered = false;
  focused = false;
  paused = false;
  imageFailed = false;
  get book(): Pick<BookSummary, 'id' | 'title' | 'coverUrl'> | null { return this.reading ? { id: this.reading.bookId, title: this.reading.title, coverUrl: this.reading.coverUrl } : this.slides[this.index] ?? null; }
  get hasReading(): boolean { return !!this.reading; }
  get hasMultipleBooks(): boolean { return !this.reading && this.slides.length > 1; }

  ngOnChanges(): void {
    this.slides = [...new Map(this.books.filter(book => book.isActive).map(book => [book.id, book])).values()];
    for (let i = this.slides.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.slides[i], this.slides[j]] = [this.slides[j], this.slides[i]];
    }
    this.index = 0;
    this.imageFailed = false;
  }
  ngOnInit(): void {
    this.paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.timer = setInterval(() => {
      if (!this.paused && !this.hovered && !this.focused && !document.hidden) this.next();
    }, 6000);
  }
  next(): void {
    if (!this.hasMultipleBooks) return;
    this.index = (this.index + 1) % this.slides.length;
    this.imageFailed = false;
    this.cdr.markForCheck();
  }
  onFocusOut(event: FocusEvent): void {
    this.focused = !!event.relatedTarget && (event.currentTarget as HTMLElement).contains(event.relatedTarget as Node);
  }
  markImageFailed(): void { this.imageFailed = true; }
  ngOnDestroy(): void { if (this.timer !== null) clearInterval(this.timer); }
}
