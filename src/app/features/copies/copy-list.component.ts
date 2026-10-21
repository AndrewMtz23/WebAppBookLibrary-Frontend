import { CopyScannerComponent } from './copy-scanner.component';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, takeUntil } from 'rxjs';
import { StaffPageHeaderComponent } from '../../shared/ui/staff-page-header/staff-page-header.component';
import { StaffBooksApi } from '../books/data-access/staff-books.api';
import { DEFAULT_STAFF_BOOK_QUERY } from '../books/data-access/staff-books.models';
import { BookDetail, BookSummary } from '../../shared/models/book.model';
import { SessionScopeService } from '../../core/auth/session-scope.service';
import { CopiesService } from './copies.service';
import { COPY_STATES, CopyCondition, CopyPage, copyError } from './copies.models';
import { parseCopyInput } from './copy-code';

@Component({ standalone: true, imports: [CommonModule, FormsModule, RouterLink, StaffPageHeaderComponent, CopyScannerComponent], templateUrl: './copy-list.component.html', styleUrl: './copies.scss' })
export class CopyListComponent {
  private readonly api = inject(CopiesService); private readonly booksApi = inject(StaffBooksApi); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router);
  private readonly scope = inject(SessionScopeService); private readonly destroy = inject(DestroyRef); private readonly context = new Subject<void>();
  readonly states = COPY_STATES; readonly book = signal<BookDetail | null>(null); readonly matches = signal<readonly BookSummary[]>([]); readonly result = signal<CopyPage | null>(null); readonly error = signal(''); readonly saving = signal(false); readonly stopped = signal(false);
  search = ''; code = ''; status = ''; page = 1; inventoryCode = ''; condition: CopyCondition = 'good'; location = ''; notes = ''; private createKey = crypto.randomUUID();
  constructor() {
    this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(() => { this.context.next(); this.book.set(null); this.result.set(null); this.matches.set([]); this.notes = ''; this.location = ''; this.stopped.set(true); });
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(p => { const id = p.get('bookId'); if (id) this.select(id); });
  }
  findBooks() { if (this.stopped()) return; this.booksApi.search({ ...DEFAULT_STAFF_BOOK_QUERY, query: this.search, mediaType: 'physical' }).pipe(takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe({ next: p => this.matches.set(p.items), error: e => this.error.set(copyError(e)) }); }
  select(id: string) { if (this.stopped()) return; this.context.next(); this.result.set(null); this.book.set(null); this.error.set(''); this.page = 1; this.booksApi.management(id).pipe(takeUntil(this.context), takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe({ next: r => { this.book.set(r.book); this.matches.set([]); this.load(); }, error: e => this.error.set(copyError(e)) }); }
  load(delta = 0) { const book = this.book(); if (!book || this.stopped()) return; this.page += delta; this.api.list(book.id, this.status, this.page).pipe(takeUntil(this.context), takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe({ next: p => this.result.set(p), error: e => this.error.set(copyError(e)) }); }
  openCode() {
    if (this.stopped()) return; const parsed = parseCopyInput(this.code, window.location.origin);
    if (!parsed) { this.error.set('Escribe un código válido o pega el enlace de una etiqueta de esta biblioteca.'); return; }
    if (parsed.kind === 'id') { void this.router.navigate(['/librarian/copies', parsed.value]); return; }
    this.api.lookup(parsed.value).pipe(takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe({ next: c => void this.router.navigate(['/librarian/copies', c.id]), error: e => this.error.set(copyError(e)) });
  }
  create() {
    const book = this.book(); if (!book || this.saving() || this.stopped() || !/^[a-zA-Z0-9-]{3,64}$/.test(this.inventoryCode.trim())) return;
    this.saving.set(true); this.error.set(''); this.api.create(book.id, { inventoryCode: this.inventoryCode, condition: this.condition, location: this.location || null, notes: this.notes || null, idempotencyKey: this.createKey }).pipe(takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe({ next: c => { this.saving.set(false); void this.router.navigate(['/librarian/copies', c.id]); }, error: e => { this.saving.set(false); this.error.set(copyError(e)); } });
  }
}
