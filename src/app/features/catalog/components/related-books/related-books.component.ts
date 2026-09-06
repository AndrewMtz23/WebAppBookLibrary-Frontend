import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BookSummary } from '../../../../shared/models/book.model';
import { BookGridComponent } from '../book-grid/book-grid.component';

@Component({ selector: 'app-related-books', standalone: true, imports: [BookGridComponent], templateUrl: './related-books.component.html', styleUrl: './related-books.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class RelatedBooksComponent { @Input() books: readonly BookSummary[] = []; }
