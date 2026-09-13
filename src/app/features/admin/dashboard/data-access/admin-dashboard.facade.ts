import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { dashboardPeriodFromParams, dashboardQueryParams } from '../../../../shared/dashboard/dashboard-period';
import { AdminDashboardApi } from './admin-dashboard.api';
import { AdminDashboardPeriod, AdminDashboardResponse, DashboardActivityItem, SecuritySummaryWidget } from './admin-dashboard.models';

@Injectable()
export class AdminDashboardFacade {
  private readonly api = inject(AdminDashboardApi); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly destroy = inject(DestroyRef);
  readonly period = signal<AdminDashboardPeriod>({ from: '', to: '', timezone: 'UTC' });
  readonly data = signal<AdminDashboardResponse | null>(null); readonly activity = signal<DashboardActivityItem[]>([]); readonly security = signal<SecuritySummaryWidget | null>(null);
  readonly loading = signal(true); readonly refreshing = signal(false); readonly error = signal('');
  readonly activityLoading = signal(true); readonly activityError = signal(''); readonly securityLoading = signal(true); readonly securityError = signal('');
  private coreRequest?: Subscription; private activityRequest?: Subscription; private securityRequest?: Subscription;
  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => { this.period.set(dashboardPeriodFromParams(params)); this.refreshAll(); });
    this.destroy.onDestroy(() => { this.coreRequest?.unsubscribe(); this.activityRequest?.unsubscribe(); this.securityRequest?.unsubscribe(); });
  }
  setPeriod(period: AdminDashboardPeriod) { void this.router.navigate([], { relativeTo: this.route, queryParams: dashboardQueryParams(period) }); }
  refreshAll() { this.refreshCore(); this.refreshActivity(); this.refreshSecurity(); }
  refreshCore() {
    this.data() ? this.refreshing.set(true) : this.loading.set(true); this.error.set('');
    this.coreRequest?.unsubscribe();
    this.coreRequest = this.api.summary(this.period()).pipe(takeUntilDestroyed(this.destroy)).subscribe({ next: data => { this.data.set(data); this.loading.set(false); this.refreshing.set(false); }, error: () => { this.loading.set(false); this.refreshing.set(false); this.error.set('No pudimos actualizar los indicadores. El contenido anterior se conserva; intenta de nuevo.'); } });
  }
  refreshActivity() {
    this.activityLoading.set(true); this.activityError.set('');
    this.activityRequest?.unsubscribe();
    this.activityRequest = this.api.activity(this.period()).pipe(takeUntilDestroyed(this.destroy)).subscribe({ next: value => { this.activity.set(value); this.activityLoading.set(false); }, error: () => { this.activityLoading.set(false); this.activityError.set('No pudimos cargar la actividad administrativa.'); } });
  }
  refreshSecurity() {
    this.securityLoading.set(true); this.securityError.set('');
    this.securityRequest?.unsubscribe();
    this.securityRequest = this.api.security(this.period()).pipe(takeUntilDestroyed(this.destroy)).subscribe({ next: value => { this.security.set(value); this.securityLoading.set(false); }, error: () => { this.securityLoading.set(false); this.securityError.set('El resumen de seguridad no está disponible.'); } });
  }
}
