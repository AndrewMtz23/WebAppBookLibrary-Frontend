import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BookSummary } from '../../../../shared/models/book.model';
import { BookCardComponent } from '../book-card/book-card.component';

@Component({ selector: 'app-book-grid', standalone: true, imports: [BookCardComponent], templateUrl: './book-grid.component.html', styleUrl: './book-grid.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class BookGridComponent {
  @Input({ required: true }) books: readonly BookSummary[] = [];
  @Input() busyFavoriteIds: ReadonlySet<string> = new Set<string>();
  @Output() readonly favoriteRequested = new EventEmitter<BookSummary>();
  @Output() readonly bookOpened = new EventEmitter<string>();
}
