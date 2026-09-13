import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BookSummary } from '../../../../shared/models/book.model';
import { BookGridComponent } from '../book-grid/book-grid.component';

@Component({ selector: 'app-related-books', standalone: true, imports: [BookGridComponent], templateUrl: './related-books.component.html', styleUrl: './related-books.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class RelatedBooksComponent {
  @Input() books: readonly BookSummary[] = [];
  @Input() busyFavoriteIds: ReadonlySet<string> = new Set();
  @Input() favoriteResolver: ((book: BookSummary) => boolean) | null = null;
  @Input() showFavorite = true;
  @Output() readonly favoriteRequested = new EventEmitter<BookSummary>();
}
