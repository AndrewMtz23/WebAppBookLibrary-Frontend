import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AdminDashboardPeriod, AdminDashboardResponse, DashboardActivityItem, SecuritySummaryWidget } from './admin-dashboard.models';

@Injectable({ providedIn: 'root' })
export class AdminDashboardApi {
  private readonly http = inject(HttpClient);
  summary(period: AdminDashboardPeriod) { return this.http.get<AdminDashboardResponse>('/api/dashboard/admin', { params: params(period) }); }
  activity(period: AdminDashboardPeriod) { return this.http.get<DashboardActivityItem[]>('/api/dashboard/admin/activity', { params: params(period) }); }
  security(period: AdminDashboardPeriod) { return this.http.get<SecuritySummaryWidget>('/api/security/summary', { params: params(period) }); }
}
function params(period: AdminDashboardPeriod): HttpParams { return new HttpParams().set('from', period.from).set('to', period.to).set('timezone', period.timezone); }
