import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, forkJoin, from, map, mergeMap, of, toArray } from 'rxjs';
import { BookDetail } from '../../../shared/models/book.model';
import { LoanSummary } from '../../../shared/models/loan.model';
import { CatalogService } from '../../catalog/data-access/catalog.service';
import { LoanMutationResponse } from '../models/reader.models';
import { LoanSection, sectionFor } from '../utils/loan-section';
import { ReaderService } from './reader.service';

export interface LibraryLoan extends LoanSummary { book: BookDetail | null; }

@Injectable()
export class MyLibraryFacade {
  private readonly reader = inject(ReaderService);
  private readonly catalog = inject(CatalogService);
  private readonly loansState = signal<readonly LibraryLoan[]>([]);
  private readonly busy = signal<ReadonlySet<string>>(new Set());
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly loans = this.loansState.asReadonly();
  readonly active = computed(() => this.inSection('active'));
  readonly dueSoon = computed(() => this.inSection('dueSoon'));
  readonly overdue = computed(() => this.inSection('overdue'));
  readonly history = computed(() => this.inSection('history'));

  constructor() { this.load(); }

  isBusy(loanId: string): boolean { return this.busy().has(loanId); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reader.getLoans({ page: 1, pageSize: 100 }).subscribe({
      next: page => {
        if (page.totalPages <= 1) this.hydrate(page.items);
        else forkJoin(Array.from({ length: page.totalPages - 1 }, (_, index) =>
          this.reader.getLoans({ page: index + 2, pageSize: 100 })
        )).subscribe({
          next: pages => this.hydrate([ ...page.items, ...pages.flatMap(item => item.items) ]),
          error: () => { this.loading.set(false); this.error.set('No pudimos cargar todo tu historial.'); }
        });
      },
      error: () => { this.loading.set(false); this.error.set('No pudimos cargar tu biblioteca.'); }
    });
  }

  openDigital(bookId: string): void {
    this.message.set('Abriendo un recurso externo seguro…');
    this.reader.getDigitalAccess(bookId).subscribe({
      next: access => {
        try {
          const url = new URL(access.resourceUrl);
          if (url.protocol !== 'https:') throw new Error('unsafe protocol');
          window.open(url.href, '_blank', 'noopener,noreferrer');
          this.message.set('El recurso se abrió en una pestaña nueva.');
        } catch {
          this.message.set('El enlace no usa una conexión HTTPS segura. Repórtalo a la biblioteca.');
        }
      },
      error: (error: HttpErrorResponse) => this.message.set(error.status === 403
        ? 'El acceso a este recurso ya no está autorizado. Actualizamos tu biblioteca.'
        : 'No pudimos abrir el recurso digital.')
    });
  }

  returnLoan(loanId: string): void { this.mutate(loanId, this.reader.returnLoan(loanId), 'El préstamo fue devuelto.'); }
  cancelLoan(loanId: string): void { this.mutate(loanId, this.reader.cancelLoan(loanId), 'La reserva fue cancelada.'); }

  private hydrate(loans: readonly LoanSummary[]): void {
    if (!loans.length) { this.loansState.set([]); this.loading.set(false); return; }
    from(loans).pipe(
      mergeMap((loan, index) => this.catalog.getById(loan.bookId).pipe(
        map(book => ({ index, item: { ...loan, book } as LibraryLoan })),
        catchError(() => of({ index, item: { ...loan, book: null } as LibraryLoan }))
      ), 6),
      toArray()
    ).subscribe(rows => {
      this.loansState.set(rows.sort((a, b) => a.index - b.index).map(row => row.item));
      this.loading.set(false);
    });
  }

  private inSection(section: LoanSection): readonly LibraryLoan[] {
    const now = new Date();
    return this.loansState().filter(loan => sectionFor(loan, now, 3) === section);
  }

  private mutate(loanId: string, request: Observable<LoanMutationResponse>, success: string): void {
    if (this.isBusy(loanId)) return;
    this.setBusy(loanId, true);
    this.message.set(null);
    request.pipe(finalize(() => this.setBusy(loanId, false))).subscribe({
      next: () => { this.message.set(success); this.load(); },
      error: (error: HttpErrorResponse) => {
        this.message.set(error.status === 409 ? 'El préstamo cambió en el servidor; sincronizamos su estado.' : 'No pudimos actualizar el préstamo.');
        if (error.status === 409) this.load();
      }
    });
  }

  private setBusy(id: string, value: boolean): void {
    this.busy.update(current => { const next = new Set(current); value ? next.add(id) : next.delete(id); return next; });
  }
}
