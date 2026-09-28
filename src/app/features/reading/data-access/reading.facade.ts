import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, Subscription, TimeoutError, finalize, takeUntil } from 'rxjs';
import { SessionScopeService } from '../../../core/auth/session-scope.service';
import { AuthService } from '../../../core/services/auth.service';
import { OperationNotificationService } from '../../../core/services/operation-notification.service';
import { ReadingService } from './reading.service';
import { ReadingListResponse, ReadingQuery, ReadingResponse, SaveReadingRequest } from '../models/reading.models';

export interface ReadingResource<T> { data: T; loading: boolean; error: string | null; }
const empty = (): ReadingListResponse => ({ items: [], page: 1, pageSize: 20, totalItems: 0, counts: { wantToRead: 0, reading: 0, finished: 0 } });
const state = <T>(data: T): ReadingResource<T> => ({ data, loading: false, error: null });

@Injectable()
export class ReadingFacade {
  private readonly api = inject(ReadingService);
  private readonly scope = inject(SessionScopeService);
  private readonly auth = inject(AuthService);
  private readonly notices = inject(OperationNotificationService);
  private readonly destroy = inject(DestroyRef);
  private listRequest?: Subscription;
  private latestRequest?: Subscription;
  private query: ReadingQuery = {};
  private requiresReload = false;
  private readonly saved = new Subject<void>();
  readonly saved$ = this.saved.asObservable();
  readonly list = signal(state(empty()));
  readonly latest = signal(state<ReadingResponse | null>(null));
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly conflict = signal(false);
  constructor() { this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(() => this.clear()); }
  clear(): void { this.requiresReload = false; this.list.set(state(empty())); this.latest.set(state(null)); this.saving.set(false); this.resetFeedback(); }
  resetFeedback(): void { if (this.requiresReload) return; this.saveError.set(''); this.conflict.set(false); }
  load(query: ReadingQuery): void {
    this.query = query; this.listRequest?.unsubscribe();
    if (!this.auth.sessionSnapshot) { this.clear(); return; }
    const version = this.scope.version;
    const reconcilesMutation = this.requiresReload;
    this.list.set({ ...this.list(), loading: true, error: null });
    this.listRequest = this.api.list(query).pipe(takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe({
      next: data => {
        if (version !== this.scope.version) return;
        if (reconcilesMutation) { this.requiresReload = false; this.resetFeedback(); }
        this.list.set(state(data));
      },
      error: () => { if (version === this.scope.version) this.list.set({ ...this.list(), loading: false, error: 'No pudimos cargar tus lecturas. Intenta de nuevo.' }); }
    });
  }
  loadLatest(): void {
    this.latestRequest?.unsubscribe();
    if (!this.auth.sessionSnapshot) { this.latest.set(state(null)); return; }
    const version = this.scope.version;
    this.latest.set({ ...this.latest(), loading: true, error: null });
    this.latestRequest = this.api.latest().pipe(takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe({
      next: value => { if (version === this.scope.version) this.latest.set(state(value.entry)); },
      error: () => { if (version === this.scope.version) this.latest.set({ data: null, loading: false, error: 'No pudimos cargar tu última lectura.' }); }
    });
  }
  save(bookId: string, request: SaveReadingRequest): void { this.mutate(() => this.api.save(bookId, request), 'Lectura guardada.'); }
  remove(bookId: string, revision: string): void { this.mutate(() => this.api.remove(bookId, revision), 'Seguimiento eliminado.'); }
  private mutate(operation: () => Observable<unknown>, message: string): void {
    if (this.saving() || this.conflict() || !this.auth.sessionSnapshot) return;
    const version = this.scope.version;
    this.saving.set(true); this.saveError.set('');
    operation().pipe(takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy), finalize(() => { if (version === this.scope.version) this.saving.set(false); })).subscribe({
      next: () => {
        if (version !== this.scope.version) return;
        this.notices.success(message); this.saved.next(); this.load(this.query); this.loadLatest();
      },
      error: error => {
        if (version !== this.scope.version) return;
        const uncertain = error.status === 0 || error.status >= 500 || error instanceof TimeoutError;
        this.requiresReload = error.status === 409 || uncertain;
        if (this.requiresReload) this.listRequest?.unsubscribe();
        this.conflict.set(error.status === 409 || uncertain);
        this.saveError.set(uncertain ? 'No pudimos confirmar el resultado. El cambio puede haberse guardado. Conservamos tu borrador; recarga para consultar el estado del servidor antes de volver a intentarlo.' : error.status === 409 ? 'La lectura cambió en otro dispositivo. Conservamos tu borrador; recarga antes de guardar.' : error.status === 404 ? 'El libro ya no está disponible. Puedes quitar su seguimiento.' : 'No pudimos guardar. Revisa tu conexión y los datos; tus cambios siguen en el formulario.');
      }
    });
  }
}
