import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, from, map, mergeMap, of, toArray } from 'rxjs';
import { BookDetail, BookSummary } from '../../../shared/models/book.model';
import { CatalogService } from '../../catalog/data-access/catalog.service';
import { Favorite } from '../models/reader.models';
import { ReaderService } from './reader.service';

export interface FavoriteBook { favoriteId: string; createdAt: string; book: BookDetail; }

@Injectable({ providedIn: 'root' })
export class FavoritesFacade {
  private readonly reader = inject(ReaderService);
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
    request.pipe(finalize(() => this.setBusy(book.id, false))).subscribe({
      error: () => {
        this.setOverride(book.id, previous);
        this.error.set('No pudimos actualizar tus favoritos. Inténtalo de nuevo.');
      }
    });
  }

  load(catalog: CatalogService, page = 1): void {
    this.loading.set(true);
    this.error.set(null);
    this.reader.getFavorites(page, 20).subscribe({
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
    this.reader.removeFavorite(book.id).pipe(finalize(() => this.setBusy(book.id, false))).subscribe({
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
      toArray()
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
