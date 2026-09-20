import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, of, switchMap, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessionScopeService } from '../../../core/auth/session-scope.service';
import { BookSummary } from '../../../shared/models/book.model';
import { CatalogService } from '../../catalog/data-access/catalog.service';
import { DEFAULT_CATALOG_QUERY } from '../../catalog/models/catalog-query';
import { BookFacet, ReaderDashboard } from '../models/reader.models';
import { ReaderService } from './reader.service';
import { AuthService } from '../../../core/services/auth.service';

export interface ResourceState<T> { data: T; loading: boolean; error: string | null; }

@Injectable()
export class DiscoverFacade {
  private readonly scope = inject(SessionScopeService);
  private readonly catalog = inject(CatalogService);
  private readonly reader = inject(ReaderService);
  private readonly auth = inject(AuthService);
  readonly newest = signal<ResourceState<readonly BookSummary[]>>(state([]));
  readonly popular = signal<ResourceState<readonly BookSummary[]>>(state([]));
  readonly facets = signal<ResourceState<readonly BookFacet[]>>(state([]));
  readonly activity = signal<ResourceState<ReaderDashboard | null>>(state(null));
  readonly activeReading = signal<ResourceState<BookSummary | null>>(state(null));
  readonly popularBooks = computed(() => this.popular().data.some(book => book.reservationCount > 0) ? this.popular().data : this.newest().data);

  readonly allBooks = computed(() => {
    const map = new Map<string, BookSummary>();
    for (const b of this.popular().data) map.set(b.id, b);
    for (const b of this.newest().data) map.set(b.id, b);
    return Array.from(map.values());
  });

  readonly featuredHeroBooks = computed(() => {
    const list = this.allBooks();
    return list.length > 0 ? list.slice(0, 6) : this.newest().data.slice(0, 6);
  });

  readonly digitalBooks = computed(() => {
    return this.allBooks().filter(b => b.mediaType === 'digital');
  });

  readonly physicalBooks = computed(() => {
    return this.allBooks().filter(b => b.mediaType === 'physical');
  });

  readonly classicBooks = computed(() => {
    return this.allBooks().filter(b => b.genres.some(g => g.toLowerCase().includes('clásico')));
  });

  constructor() {
    this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.newest.set(state([])); this.popular.set(state([])); this.facets.set(state([]));
      this.activity.set(state(null)); this.activeReading.set(state(null));
      this.load();
    });
    this.load();
  }

  load(): void {
    this.request(this.catalog.search({ ...DEFAULT_CATALOG_QUERY, pageSize: 24 }), this.newest, page => page.items, 'No pudimos cargar las novedades.');
    this.request(this.catalog.search({ ...DEFAULT_CATALOG_QUERY, pageSize: 24, sort: 'reservationCount', direction: 'desc' }), this.popular, page => page.items, 'La selección popular no está disponible.');
    this.request(this.catalog.getFacets(), this.facets, value => value, 'No pudimos cargar las categorías.');
    if (this.auth.sessionSnapshot?.user.role === 'user') {
      this.request(this.reader.getDashboard(), this.activity, value => value, 'Tu actividad no está disponible por ahora.');
      const active = this.reader.getLoans({ status: 'active', page: 1, pageSize: 1 }).pipe(
        switchMap(page => page.items[0] ? this.catalog.getById(page.items[0].bookId) : of(null)),
        map(book => book as BookSummary | null)
      );
      this.request(active, this.activeReading, value => value, 'No pudimos cargar tu lectura actual.');
    } else {
      this.activity.set(state(null, false));
      this.activeReading.set(state(null, false));
    }
  }

  private request<T, R>(source: Observable<T>, target: { set(value: ResourceState<R>): void }, select: (value: T) => R, message: string): void {
    source.pipe(takeUntil(this.scope.changed$)).subscribe({
      next: value => target.set({ data: select(value), loading: false, error: null }),
      error: () => target.set({ data: (target === this.activity || target === this.activeReading) ? null as R : [] as R, loading: false, error: message })
    });
  }
}

function state<T>(data: T, loading = true): ResourceState<T> { return { data, loading, error: null }; }
