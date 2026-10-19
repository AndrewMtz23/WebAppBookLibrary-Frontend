import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { Assignee, NewTicket, StaffDetail, SupportPage, TicketDetail, TicketSummary } from './support.models';
@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/support/tickets';
  private timed<T>(request: Observable<T>): Observable<T> { return request.pipe(timeout(20_000)); }
  create(request: NewTicket): Observable<TicketDetail> { return this.timed(this.http.post<TicketDetail>(this.url, request)); }
  list(staff: boolean, page = 1, status = '', category = ''): Observable<SupportPage<TicketSummary>> {
    let params = new HttpParams().set('page', page).set('pageSize', 20);
    if (status) params = params.set('status', status); if (category) params = params.set('category', category);
    return this.timed(this.http.get<SupportPage<TicketSummary>>(this.url + (staff ? '' : '/my'), { params }));
  }
  detail(id: string, page = 1): Observable<TicketDetail> { return this.timed(this.http.get<TicketDetail>(`${this.url}/${encodeURIComponent(id)}`, { params: { page, pageSize: 20 } })); }
  staffDetail(id: string, page = 1): Observable<StaffDetail> { return this.timed(this.http.get<StaffDetail>(`${this.url}/${encodeURIComponent(id)}/staff`, { params: { page, pageSize: 20 } })); }
  reply(id: string, text: string, version: number, staff: boolean): Observable<number> { return this.timed(this.http.post<number>(`${this.url}/${encodeURIComponent(id)}/${staff ? 'staff/' : ''}replies`, { text, expectedVersion: version })); }
  addNote(id: string, text: string, version: number): Observable<number> { return this.timed(this.http.post<number>(`${this.url}/${encodeURIComponent(id)}/notes`, { text, expectedVersion: version })); }
  changeStatus(id: string, status: string, reason: string, version: number, staff: boolean): Observable<number> { return this.timed(this.http.put<number>(`${this.url}/${encodeURIComponent(id)}/${staff ? 'staff/' : ''}status`, { status, reason, expectedVersion: version })); }
  assign(id: string, assigneeId: string | null, version: number): Observable<number> { return this.timed(this.http.put<number>(`${this.url}/${encodeURIComponent(id)}/assignment`, { assigneeId, expectedVersion: version })); }
  assignees(category: string): Observable<Assignee[]> { return this.timed(this.http.get<Assignee[]>(this.url + '/assignees', { params: { category } })); }
}
