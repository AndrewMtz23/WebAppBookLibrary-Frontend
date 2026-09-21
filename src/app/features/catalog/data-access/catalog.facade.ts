import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, combineLatest, map, of, startWith, switchMap, tap } from 'rxjs';
import { BookSummary } from '../../../shared/models/book.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { CatalogQuery, DEFAULT_CATALOG_QUERY } from '../models/catalog-query';
import { parseCatalogQuery, serializeCatalogQuery } from '../models/catalog-query-codec';
import { CatalogService } from './catalog.service';
import { SessionScopeService } from '../../../core/auth/session-scope.service';

interface CatalogState {
  page: PagedResult<BookSummary> | null;
  initialLoading: boolean;
  refreshing: boolean;
  error: string | null;
}

@Injectable()
export class CatalogFacade {
  private readonly scope = inject(SessionScopeService);
  private identityVersion = this.scope.version;
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly retryRequest = new Subject<void>();
  private readonly queryState = signal<CatalogQuery>(DEFAULT_CATALOG_QUERY);
  private readonly state = signal<CatalogState>({ page: null, initialLoading: true, refreshing: false, error: null });

  readonly query = this.queryState.asReadonly();
  readonly items = computed(() => this.state().page?.items ?? []);
  readonly totalItems = computed(() => this.state().page?.totalItems ?? 0);
  readonly totalPages = computed(() => this.state().page?.totalPages ?? 0);
  readonly initialLoading = computed(() => this.state().initialLoading);
  readonly refreshing = computed(() => this.state().refreshing);
  readonly error = computed(() => this.state().error);

  constructor() {
    combineLatest([this.route.queryParamMap, this.retryRequest.pipe(startWith(undefined)), this.scope.changed$.pipe(startWith(undefined))]).pipe(
      map(([params]) => parseCatalogQuery(params)),
      tap(query => {
        if (this.identityVersion !== this.scope.version) {
          this.identityVersion = this.scope.version;
          this.state.set({ page: null, initialLoading: true, refreshing: false, error: null });
        }
        this.queryState.set(query);
        const hasPage = this.state().page !== null;
        this.state.update(state => ({ ...state, initialLoading: !hasPage, refreshing: hasPage, error: null }));
      }),
      switchMap(query => this.catalog.search(query).pipe(
        map(page => ({ page, error: null as string | null })),
        catchError(error => of({ page: null, error: error?.message || 'No fue posible cargar el catálogo.' }))
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      this.state.update(state => ({
        page: result.page ?? state.page,
        initialLoading: false,
        refreshing: false,
        error: result.error
      }));
    });
  }

  patchQuery(patch: Partial<CatalogQuery>): Promise<boolean> {
    const resetsPage = Object.keys(patch).some(key => key !== 'page');
    const next = { ...this.queryState(), ...patch, page: resetsPage ? 1 : patch.page ?? this.queryState().page };
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: serializeCatalogQuery(next)
    });
  }

  clearFilters(): Promise<boolean> {
    const current = this.queryState();
    return this.patchQuery({
      query: null,
      genre: null,
      mediaType: null,
      language: null,
      available: null,
      sort: current.sort,
      direction: current.direction
    });
  }

  retry(): void {
    this.retryRequest.next();
  }
}
