import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ReaderService } from './reader.service';

@Injectable({ providedIn: 'root' })
export class ReservationsFacade {
  private readonly reader = inject(ReaderService);
  private readonly busy = signal<ReadonlySet<string>>(new Set());
  readonly message = signal<string | null>(null);
  readonly successfulBookId = signal<string | null>(null);

  isBusy(bookId: string): boolean { return this.busy().has(bookId); }

  reserve(bookId: string): void {
    if (this.isBusy(bookId)) return;
    this.setBusy(bookId, true);
    this.message.set(null);
    this.reader.reserve(bookId).pipe(finalize(() => this.setBusy(bookId, false))).subscribe({
      next: response => {
        this.successfulBookId.set(bookId);
        this.message.set(response.message || 'Tu reserva quedó confirmada.');
      },
      error: (error: HttpErrorResponse) => this.message.set(this.errorMessage(error))
    });
  }

  private errorMessage(error: HttpErrorResponse): string {
    const code = error.error?.code;
    if (code === 'duplicate_active_reservation' || code === 'duplicate_active') return 'Ya tienes una reserva activa de este libro.';
    if (code === 'book_unavailable') return 'Este libro no tiene ejemplares disponibles por ahora.';
    if (error.status === 0) return 'No recibimos confirmación. Confirma tu conexión y revisa Mi biblioteca antes de intentar otra vez.';
    return error.error?.title || 'No pudimos completar la reserva.';
  }

  private setBusy(bookId: string, value: boolean): void {
    this.busy.update(current => {
      const next = new Set(current);
      value ? next.add(bookId) : next.delete(bookId);
      return next;
    });
  }
}
