import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, from, map, mergeMap, of, toArray, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessionScopeService } from '../../../core/auth/session-scope.service';
import { BookDetail, BookSummary } from '../../../shared/models/book.model';
import { CatalogService } from '../../catalog/data-access/catalog.service';
import { Favorite } from '../models/reader.models';
import { ReaderService } from './reader.service';
import { OperationNotificationService } from '../../../core/services/operation-notification.service';

export interface FavoriteBook { favoriteId: string; createdAt: string; book: BookDetail; }

@Injectable({ providedIn: 'root' })
export class FavoritesFacade {
  private readonly scope = inject(SessionScopeService);
  private readonly reader = inject(ReaderService);
  private readonly notifications = inject(OperationNotificationService);
  private readonly overrides = signal<Readonly<Record<string, boolean>>>({});
  private readonly busy = signal<ReadonlySet<string>>(new Set<string>());
  private readonly list = signal<readonly FavoriteBook[]>([]);
  readonly error = signal<string | null>(null);
  readonly busyIds = this.busy.asReadonly();
  readonly items = this.list.asReadonly();
  readonly books = computed(() => this.list().map(item => ({ ...item.book, isFavorite: this.isFavorite(item.book) })));
  readonly loading = signal(false);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly totalItems = signal(0);

  constructor() {
    this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.overrides.set({}); this.busy.set(new Set()); this.list.set([]);
      this.error.set(null); this.loading.set(false); this.page.set(1);
      this.totalPages.set(0); this.totalItems.set(0);
    });
  }

  isFavorite(book: BookSummary): boolean {
    return this.overrides()[book.id] ?? book.isFavorite;
  }

  isBusy(bookId: string): boolean {
    return this.busy().has(bookId);
  }

  toggle(book: BookSummary): void {
    if (this.isBusy(book.id)) return;
    const previous = this.isFavorite(book);
    const next = !previous;
    this.error.set(null);
    this.setOverride(book.id, next);
    this.setBusy(book.id, true);
    const request: Observable<unknown> = next
      ? this.reader.addFavorite(book.id)
      : this.reader.removeFavorite(book.id);
    const version = this.scope.version;
    request.pipe(takeUntil(this.scope.changed$), finalize(() => { if (version === this.scope.version) this.setBusy(book.id, false); })).subscribe({
      next: () => this.notifications.success(next ? 'Libro guardado' : 'Libro quitado de favoritos'),
      error: () => {
        this.setOverride(book.id, previous);
        this.error.set('No pudimos actualizar tus favoritos. Inténtalo de nuevo.');
        this.notifications.error(this.error()!);
      }
    });
  }

  load(catalog: CatalogService, page = 1): void {
    this.loading.set(true);
    this.error.set(null);
    this.reader.getFavorites(page, 20).pipe(takeUntil(this.scope.changed$)).subscribe({
      next: result => {
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
        this.totalItems.set(result.totalItems);
        this.resolveDetails(catalog, result.items);
      },
      error: () => { this.loading.set(false); this.error.set('No pudimos cargar tus favoritos.'); }
    });
  }

  remove(book: BookSummary): void {
    if (this.isBusy(book.id)) return;
    const index = this.list().findIndex(item => item.book.id === book.id);
    const removed = index >= 0 ? this.list()[index] : null;
    if (removed) {
      this.list.update(items => items.filter((_, current) => current !== index));
      this.totalItems.update(total => Math.max(0, total - 1));
    }
    this.setOverride(book.id, false);
    this.setBusy(book.id, true);
    const version = this.scope.version;
    this.reader.removeFavorite(book.id).pipe(takeUntil(this.scope.changed$), finalize(() => { if (version === this.scope.version) this.setBusy(book.id, false); })).subscribe({
      next: () => this.notifications.success('Libro quitado de favoritos'),
      error: () => {
        if (removed) {
          this.list.update(items => {
            const restored = [...items];
            restored.splice(Math.min(index, restored.length), 0, removed);
            return restored;
          });
          this.totalItems.update(total => total + 1);
        }
        this.setOverride(book.id, true);
        this.error.set('No pudimos quitar el favorito. El libro volvió a su posición.');
        this.notifications.error(this.error()!);
      }
    });
  }

  private resolveDetails(catalog: CatalogService, favorites: readonly Favorite[]): void {
    if (!favorites.length) { this.list.set([]); this.loading.set(false); return; }
    from(favorites).pipe(
      mergeMap((favorite, index) => catalog.getById(favorite.bookId).pipe(
        map(book => ({ index, item: book.isActive ? { favoriteId: favorite.id, createdAt: favorite.createdAt, book } : null })),
        catchError(() => of({ index, item: null }))
      ), 4),
      toArray(), takeUntil(this.scope.changed$)
    ).subscribe(rows => {
      this.list.set(rows.sort((a, b) => a.index - b.index).flatMap(row => row.item ? [row.item] : []));
      this.loading.set(false);
    });
  }

  private setOverride(bookId: string, value: boolean): void {
    this.overrides.update(current => ({ ...current, [bookId]: value }));
  }

  private setBusy(bookId: string, value: boolean): void {
    this.busy.update(current => {
      const next = new Set(current);
      value ? next.add(bookId) : next.delete(bookId);
      return next;
    });
  }
}
