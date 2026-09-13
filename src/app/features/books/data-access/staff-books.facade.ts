import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, finalize, merge, of, switchMap, takeUntil, tap } from 'rxjs';
import { BookSummary } from '../../../shared/models/book.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { StaffBooksApi } from './staff-books.api';
import { BookManagement, BookWriteRequest, DEFAULT_STAFF_BOOK_QUERY, StaffBookQuery } from './staff-books.models';

@Injectable()
export class StaffBooksFacade {
  private readonly api = inject(StaffBooksApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly refresh$ = new Subject<void>();
  private readonly editorChanged$ = new Subject<void>();
  private readonly destroyRef = inject(DestroyRef);
  readonly query = signal<StaffBookQuery>({ ...DEFAULT_STAFF_BOOK_QUERY });
  readonly page = signal<PagedResult<BookSummary> | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly editorOpen = signal(false);
  readonly editorRecord = signal<BookManagement | null>(null);
  readonly conflictRecord = signal<BookManagement | null>(null);
  readonly saving = signal(false);
  readonly editorError = signal('');
  readonly editLoading = signal(false);
  readonly commandBusy = signal(false);
  readonly pending = signal<{ book: BookSummary; permanent: boolean } | null>(null);
  private editVersion = 0;

  constructor() {
    merge(this.route.queryParamMap.pipe(tap(params => {
      this.query.set(this.decode(params));
      if (params.get('create') === 'true' && !this.editorOpen()) this.create();
    })), this.refresh$).pipe(
      switchMap(() => {
        this.loading.set(true); this.error.set('');
        return this.api.search(this.query()).pipe(
        tap(page => this.page.set(page)),
        catchError(() => { this.error.set('No pudimos cargar el catálogo. Inténtalo de nuevo.'); return of(null); }),
        finalize(() => this.loading.set(false))
        );
      }), takeUntilDestroyed()
    ).subscribe();
  }
  private decode(params: ParamMap): StaffBookQuery {
    const q = { ...DEFAULT_STAFF_BOOK_QUERY };
    for (const key of ['query', 'bookId', 'genre', 'language'] as const) q[key] = (params.get(key) ?? '').slice(0, key === 'query' ? 200 : 100);
    for (const key of ['available', 'isActive', 'lowStock', 'missingResource'] as const) {
      const value = params.get(key); q[key] = value === 'true' || value === 'false' ? value : '';
    }
    q.mediaType = ['physical', 'digital'].includes(params.get('mediaType') ?? '') ? params.get('mediaType')! : '';
    q.sort = ['title', 'createdAt', 'publishedDate'].includes(params.get('sort') ?? '') ? params.get('sort')! : 'title';
    q.direction = params.get('direction') === 'desc' ? 'desc' : 'asc';
    const page = Number(params.get('page')); q.page = Number.isSafeInteger(page) && page >= 1 && page <= 2147483647 ? page : 1;
    const size = Number(params.get('pageSize')); q.pageSize = Number.isInteger(size) && size >= 1 && size <= 100 ? size : 20;
    return q;
  }
  filters(value: Partial<StaffBookQuery>) { this.navigate({ ...this.query(), ...value, page: 1 }); }
  goToPage(page: number) { this.navigate({ ...this.query(), page }); }
  reset() { this.navigate({ ...DEFAULT_STAFF_BOOK_QUERY }); }
  private navigate(q: StaffBookQuery) {
    void this.router.navigate([], { relativeTo: this.route, queryParams: Object.fromEntries(Object.entries(q).filter(([, value]) => value !== '')) });
  }
  refresh() { this.refresh$.next(); }
  private cancelEditorRequests() { this.editVersion++; this.editorChanged$.next(); }
  create() {
    if (this.saving()) return;
    this.cancelEditorRequests(); this.editorRecord.set(null); this.conflictRecord.set(null); this.editorError.set(''); this.editorOpen.set(true);
  }
  edit(book: BookSummary) {
    if (this.saving()) return;
    this.cancelEditorRequests();
    const version = this.editVersion;
    this.conflictRecord.set(null);
    this.editLoading.set(true); this.error.set('');
    this.api.management(book.id).pipe(takeUntil(this.editorChanged$), takeUntilDestroyed(this.destroyRef), finalize(() => this.editLoading.set(false))).subscribe({
      next: record => { if (version !== this.editVersion) return; this.editorRecord.set(record); this.conflictRecord.set(null); this.editorError.set(''); this.editorOpen.set(true); },
      error: () => { if (version === this.editVersion) this.error.set('No pudimos abrir el libro. Vuelve a seleccionar Editar.'); }
    });
  }
  closeEditor() { if (!this.saving()) { this.cancelEditorRequests(); this.conflictRecord.set(null); this.editorOpen.set(false); } }
  save(body: BookWriteRequest) {
    if (this.saving() || this.editLoading()) return;
    this.cancelEditorRequests();
    const version = this.editVersion;
    this.saving.set(true); this.editorError.set(''); this.conflictRecord.set(null);
    const id = this.editorRecord()?.book.id;
    (id ? this.api.update(id, body) : this.api.create(body)).pipe(takeUntil(this.editorChanged$), takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.editorOpen.set(false); this.notice.set('Libro guardado.'); this.refresh(); },
      error: error => {
        this.editorError.set(error.status === 409 ? 'No se guardó: el ISBN, el inventario o el estado actual entran en conflicto. Tu borrador se conserva.' : error.status === 400 ? 'Revisa los datos del libro. El servidor rechazó algunos valores; tu borrador se conserva.' : 'No pudimos guardar el libro. Tu borrador se conserva; puedes reintentar.');
        if (error.status === 409 && id) {
          const isCurrent = () => version === this.editVersion && this.editorOpen() && this.editorRecord()?.book.id === id;
          this.api.management(id).pipe(takeUntil(this.editorChanged$), takeUntilDestroyed(this.destroyRef)).subscribe({
            next: record => { if (isCurrent() && record.book.id === id) this.conflictRecord.set(record); },
            error: () => { if (isCurrent()) this.editorError.update(message => message + ' No pudimos recuperar la versión actual; vuelve a intentar guardar para consultarla.'); }
          });
        }
      }
    });
  }
  reloadEditor() { const current = this.conflictRecord(); if (!this.saving() && current && current.book.id === this.editorRecord()?.book.id) { this.editorRecord.set(current); this.conflictRecord.set(null); this.editorError.set(''); } }
  requestStatus(book: BookSummary) { this.pending.set({ book, permanent: false }); }
  requestPermanent(book: BookSummary) { this.pending.set({ book, permanent: true }); }
  cancelCommand() { if (!this.commandBusy()) this.pending.set(null); }
  confirmCommand() {
    const command = this.pending(); if (!command || this.commandBusy()) return;
    this.commandBusy.set(true); this.error.set('');
    (command.permanent ? this.api.permanent(command.book.id) : this.api.status(command.book.id, !command.book.isActive)).pipe(finalize(() => this.commandBusy.set(false))).subscribe({
      next: () => { this.pending.set(null); this.notice.set(command.permanent ? 'Libro eliminado definitivamente.' : 'Estado del libro actualizado.'); this.refresh(); },
      error: error => { this.pending.set(null); if (error.status === 409) this.refresh(); this.error.set(error.status === 409 ? 'No se puede eliminar: el libro debe estar inactivo y no tener préstamos ni favoritos asociados. Se ha solicitado la versión actual del catálogo.' : 'No se pudo completar la acción. Vuelve a intentarlo.'); }
    });
  }
}
