import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { BookSummary } from '../../../shared/models/book.model';
import { CatalogService } from '../../catalog/data-access/catalog.service';
import { DEFAULT_CATALOG_QUERY } from '../../catalog/models/catalog-query';
import { BookFacet, ReaderDashboard } from '../models/reader.models';
import { ReaderService } from './reader.service';

export interface ResourceState<T> { data: T; loading: boolean; error: string | null; }

@Injectable()
export class DiscoverFacade {
  private readonly catalog = inject(CatalogService);
  private readonly reader = inject(ReaderService);
  readonly newest = signal<ResourceState<readonly BookSummary[]>>(state([]));
  readonly popular = signal<ResourceState<readonly BookSummary[]>>(state([]));
  readonly facets = signal<ResourceState<readonly BookFacet[]>>(state([]));
  readonly activity = signal<ResourceState<ReaderDashboard | null>>(state(null));
  readonly popularBooks = computed(() => this.popular().data.length ? this.popular().data : this.newest().data);

  constructor() { this.load(); }

  load(): void {
    this.request(this.catalog.search({ ...DEFAULT_CATALOG_QUERY, pageSize: 8 }), this.newest, page => page.items, 'No pudimos cargar las novedades.');
    this.request(this.catalog.search({ ...DEFAULT_CATALOG_QUERY, pageSize: 8, sort: 'reservationCount', direction: 'desc' }), this.popular, page => page.items, 'La selección popular no está disponible.');
    this.request(this.catalog.getFacets(), this.facets, value => value, 'No pudimos cargar las categorías.');
    this.request(this.reader.getDashboard(), this.activity, value => value, 'Tu actividad no está disponible por ahora.');
  }

  private request<T, R>(source: Observable<T>, target: { set(value: ResourceState<R>): void }, select: (value: T) => R, message: string): void {
    source.subscribe({
      next: value => target.set({ data: select(value), loading: false, error: null }),
      error: () => target.set({ data: target === this.activity ? null as R : [] as R, loading: false, error: message })
    });
  }
}

function state<T>(data: T): ResourceState<T> { return { data, loading: true, error: null }; }
