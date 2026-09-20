import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessionScopeService } from '../../../core/auth/session-scope.service';
import { ReaderService } from './reader.service';
import { ApiError } from '../../../core/http/api-error';

@Injectable({ providedIn: 'root' })
export class ReservationsFacade {
  private readonly scope = inject(SessionScopeService);
  private readonly reader = inject(ReaderService);
  private readonly busy = signal<ReadonlySet<string>>(new Set());
  readonly message = signal<string | null>(null);
  readonly successfulBookId = signal<string | null>(null);
  private readonly confirmed = new Subject<string>();
  readonly confirmed$ = this.confirmed.asObservable();

  constructor() {
    this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(() => { this.busy.set(new Set()); this.resetFeedback(); });
  }

  resetFeedback(): void { this.message.set(null); this.successfulBookId.set(null); }

  isBusy(bookId: string): boolean { return this.busy().has(bookId); }

  reserve(bookId: string): void {
    if (this.isBusy(bookId)) return;
    this.setBusy(bookId, true);
    this.message.set(null);
    const version = this.scope.version;
    this.reader.reserve(bookId).pipe(takeUntil(this.scope.changed$), finalize(() => { if (version === this.scope.version) this.setBusy(bookId, false); })).subscribe({
      next: () => {
        this.successfulBookId.set(bookId);
        this.message.set('Tu reserva quedó confirmada.');
        this.confirmed.next(bookId);
      },
      error: (error: HttpErrorResponse | ApiError) => this.message.set(this.errorMessage(error))
    });
  }

  private errorMessage(error: HttpErrorResponse | ApiError): string {
    const code = error instanceof ApiError ? error.code : error.error?.code;
    if (code === 'duplicate_active_reservation' || code === 'duplicate_active') return 'Ya tienes una reserva activa de este libro.';
    if (code === 'book_unavailable') return 'Este libro no tiene ejemplares disponibles por ahora.';
    if (error.status === 0) return 'No recibimos confirmación. Confirma tu conexión y revisa Mi biblioteca antes de intentar otra vez.';
    return 'No pudimos completar la reserva. Inténtalo de nuevo o revisa Mi biblioteca.';
  }

  private setBusy(bookId: string, value: boolean): void {
    this.busy.update(current => {
      const next = new Set(current);
      value ? next.add(bookId) : next.delete(bookId);
      return next;
    });
  }
}
