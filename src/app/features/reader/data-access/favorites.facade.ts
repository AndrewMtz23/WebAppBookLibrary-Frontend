import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { BookSummary } from '../../../shared/models/book.model';
import { ReaderService } from './reader.service';

@Injectable({ providedIn: 'root' })
export class FavoritesFacade {
  private readonly reader = inject(ReaderService);
  private readonly overrides = signal<Readonly<Record<string, boolean>>>({});
  private readonly busy = signal<ReadonlySet<string>>(new Set<string>());
  readonly error = signal<string | null>(null);
  readonly busyIds = this.busy.asReadonly();

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
