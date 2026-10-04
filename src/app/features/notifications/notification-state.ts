import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subscription, finalize, takeUntil, timeout } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SessionScopeService } from '../../core/auth/session-scope.service';

export interface Notice { id: string; type: string; title: string; body: string; targetType: string; targetId: string; createdAt: string; readAt: string | null; dueAt: string | null; }
export interface NoticePage { items: Notice[]; nextCursor: number | null; readThrough: number; unreadCount: number; }
export interface NoticePreferences { reminders: boolean; email: boolean; emailVerified: boolean; }

@Injectable({ providedIn: 'root' })
export class NotificationState {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly scope = inject(SessionScopeService);
  private readonly destroy = inject(DestroyRef);
  private readonly url = '/api/notifications/my';
  private listRequest?: Subscription;
  private countRequest?: Subscription;
  private preferencesRequest?: Subscription;
  private through = 0;
  private lastMore = false;
  readonly items = signal<Notice[]>([]);
  readonly count = signal<number | null>(null);
  readonly nextCursor = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly feedback = signal('');
  readonly preferences = signal<NoticePreferences | null>(null);
  readonly preferencesError = signal('');
  readonly filter = signal<'all' | 'unread' | 'read'>('all');
  constructor() { this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(() => this.clear()); }
  private clear(): void {
    this.items.set([]); this.count.set(null); this.nextCursor.set(null); this.through = 0;
    this.preferences.set(null); this.error.set(''); this.feedback.set(''); this.preferencesError.set(''); this.loading.set(false); this.saving.set(false); this.filter.set('all');
  }
  private scoped<T>(request: Observable<T>): Observable<T> { return request.pipe(timeout(20_000), takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)); }
  refreshCount(): void {
    if (!this.auth.sessionSnapshot || this.loading() || this.saving()) return;
    this.countRequest?.unsubscribe();
    this.countRequest = this.scoped(this.http.get<{ count: number }>(this.url + '/unread-count')).subscribe({ next: value => this.count.set(value.count), error: () => this.count.set(null) });
  }
  setFilter(value: 'all' | 'unread' | 'read'): void { this.filter.set(value); this.load(); }
  retry(): void { this.load(this.lastMore); }
  load(more = false): void {
    if (!this.auth.sessionSnapshot || (more && !this.nextCursor())) return;
    this.listRequest?.unsubscribe(); this.countRequest?.unsubscribe();
    this.lastMore = more;
    const cursor = more ? this.nextCursor() : null;
    let params = new HttpParams().set('pageSize', 20);
    if (cursor) params = params.set('before', cursor);
    if (this.filter() !== 'all') params = params.set('read', this.filter() === 'read');
    this.loading.set(true); this.error.set('');
    this.listRequest = this.scoped(this.http.get<NoticePage>(this.url, { params })).subscribe({
      next: page => { this.items.set(more ? [...this.items(), ...page.items] : page.items); this.count.set(page.unreadCount); this.nextCursor.set(page.nextCursor); if (!more) this.through = page.readThrough; this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('No pudimos cargar los avisos. Intenta de nuevo.'); }
    });
  }
  read(id: string): void { this.mutate(this.http.put<void>(this.url + '/' + encodeURIComponent(id) + '/read', {})); }
  readAll(): void { this.mutate(this.http.put<void>(this.url + '/read-all', { through: this.through })); }
  private mutate(request: Observable<unknown>): void {
    if (this.saving() || !this.auth.sessionSnapshot) return;
    this.saving.set(true); this.feedback.set('');
    this.scoped(request).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.feedback.set('Lectura actualizada.'); this.load(); },
      error: () => { this.feedback.set('No pudimos confirmar el cambio. Actualiza para consultar el estado; puedes volver a marcar la lectura sin duplicarla.'); }
    });
  }
  loadPreferences(): void {
    if (!this.auth.sessionSnapshot) return;
    this.preferencesRequest?.unsubscribe(); this.preferencesError.set('');
    this.preferencesRequest = this.scoped(this.http.get<NoticePreferences>(this.url + '/preferences')).subscribe({ next: value => this.preferences.set(value), error: () => this.preferencesError.set('No pudimos cargar tus preferencias.') });
  }
  savePreferences(reminders: boolean, email: boolean): void {
    if (this.saving() || !this.auth.sessionSnapshot) return;
    this.saving.set(true); this.preferencesError.set(''); this.feedback.set('');
    this.scoped(this.http.put<NoticePreferences>(this.url + '/preferences', { reminders, email })).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: value => { this.preferences.set(value); this.feedback.set('Preferencias guardadas.'); },
      error: e => this.preferencesError.set(e.status === 409 ? 'Verifica tu correo antes de activar los avisos por correo.' : 'No pudimos confirmar las preferencias. Conservamos tus cambios; vuelve a consultar antes de guardar.')
    });
  }
}
