import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { dashboardPeriodFromParams, dashboardQueryParams } from '../../../../shared/dashboard/dashboard-period';
import { LibrarianDashboardApi } from './librarian-dashboard.api';
import { LibrarianDashboardPeriod, LibrarianDashboardResponse } from './librarian-dashboard.models';
@Injectable()
export class LibrarianDashboardFacade {
  private readonly api = inject(LibrarianDashboardApi); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly destroy = inject(DestroyRef);
  readonly period = signal<LibrarianDashboardPeriod>({ from: '', to: '', timezone: 'UTC' }); readonly data = signal<LibrarianDashboardResponse | null>(null);
  readonly loading = signal(true); readonly refreshing = signal(false); readonly error = signal('');
  private request?: Subscription;
  constructor() { this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => { this.period.set(dashboardPeriodFromParams(params)); this.refresh(); }); this.destroy.onDestroy(()=>this.request?.unsubscribe()); }
  setPeriod(period: LibrarianDashboardPeriod) { void this.router.navigate([], { relativeTo: this.route, queryParams: dashboardQueryParams(period) }); }
  refresh() {
    this.data() ? this.refreshing.set(true) : this.loading.set(true); this.error.set('');
    this.request?.unsubscribe();
    this.request = this.api.summary(this.period()).pipe(takeUntilDestroyed(this.destroy)).subscribe({ next: data => { this.data.set(data); this.loading.set(false); this.refreshing.set(false); }, error: () => { this.loading.set(false); this.refreshing.set(false); this.error.set('No pudimos actualizar la operación. El contenido anterior se conserva; intenta de nuevo.'); } });
  }
}
