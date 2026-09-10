import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookSummary } from '../../../shared/models/book.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { DEFAULT_STAFF_BOOK_QUERY, StaffBookQuery } from '../data-access/staff-books.models';

@Component({ selector: 'app-staff-book-list', standalone: true, imports: [FormsModule], templateUrl: './staff-book-list.component.html', styleUrl: './staff-books.scss' })
export class StaffBookListComponent implements OnChanges {
  @Input() page: PagedResult<BookSummary> | null = null;
  @Input() query = { ...DEFAULT_STAFF_BOOK_QUERY };
  @Input() loading = false;
  @Input() error = '';
  @Input() notice = '';
  @Input() editLoading = false;
  @Input() editorSaving = false;
  @Input() canPermanentDelete = false;
  @Output() readonly filters = new EventEmitter<Partial<StaffBookQuery>>();
  @Output() readonly reset = new EventEmitter<void>();
  @Output() readonly refresh = new EventEmitter<void>();
  @Output() readonly create = new EventEmitter<void>();
  @Output() readonly edit = new EventEmitter<BookSummary>();
  @Output() readonly status = new EventEmitter<BookSummary>();
  @Output() readonly permanent = new EventEmitter<BookSummary>();
  @Output() readonly goToPage = new EventEmitter<number>();
  draft = { ...DEFAULT_STAFF_BOOK_QUERY };
  readonly brokenCovers = new Set<string>();
  ngOnChanges(changes: SimpleChanges) { if (changes['query']) this.draft = { ...this.query }; }
  get filtered() { return ['query', 'genre', 'mediaType', 'language', 'available', 'isActive', 'lowStock', 'missingResource'].some(key => !!this.query[key as keyof StaffBookQuery]); }
  deletePermanently(book: BookSummary) { if (this.canPermanentDelete && !book.isActive) this.permanent.emit(book); }
}
