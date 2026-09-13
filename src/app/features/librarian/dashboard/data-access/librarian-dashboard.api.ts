import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { LibrarianDashboardPeriod, LibrarianDashboardResponse } from './librarian-dashboard.models';
@Injectable({ providedIn: 'root' })
export class LibrarianDashboardApi {
  private readonly http = inject(HttpClient);
  summary(period: LibrarianDashboardPeriod) {
    const params = new HttpParams().set('from', period.from).set('to', period.to).set('timezone', period.timezone);
    return this.http.get<LibrarianDashboardResponse>('/api/dashboard/librarian', { params });
  }
}
