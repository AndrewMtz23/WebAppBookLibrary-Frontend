import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { timeout } from 'rxjs';

export interface CirculationPolicy { mode: 'legacy' | 'active' | 'draining'; pickupHours: number; loanDays: number; renewalDays: number; maxRenewals: number; }
export interface CirculationPage<T> { items: T[]; totalCount: number; }
export interface Pickup { id: string; bookId: string; bookTitle: string; userDisplayName: string; status: string; pickupExpiresAt: string; version: number; }
export interface WaitEntry { id: string; bookId: string; bookTitle: string; status: string; queuePosition: number | null; }
export interface Renewal { id: string; loanId: string; bookTitle: string; userDisplayName: string; status: string; originalDueAt: string; requestedDueAt: string; decisionReason: string | null; version: number; }

@Injectable({ providedIn: 'root' })
export class CirculationService {
  private readonly http = inject(HttpClient);
  policy() { return this.http.get<CirculationPolicy>('/api/circulation/policy').pipe(timeout(20000)); }
  own(bookId: string) { return this.http.get<{ pickup: { id: string; status: string; pickupExpiresAt: string } | null; waiting: { id: string; status: string; queuePosition: number } | null }>(`/api/circulation/my/books/${encodeURIComponent(bookId)}`).pipe(timeout(20000)); }
  reserve(bookId: string, idempotencyKey: string) { return this.http.post<Pickup>('/api/pickup-reservations', { bookId, idempotencyKey }).pipe(timeout(20000)); }
  join(bookId: string, idempotencyKey = crypto.randomUUID()) { return this.http.post('/api/waitlist', { bookId, idempotencyKey }).pipe(timeout(20000)); }
  leave(id: string) { return this.http.delete(`/api/waitlist/${encodeURIComponent(id)}`).pipe(timeout(20000)); }
  waitlist(page = 1) { return this.http.get<CirculationPage<WaitEntry>>('/api/waitlist/my', { params: { page, pageSize: 20 } }).pipe(timeout(20000)); }
  pickups(staff = false, page = 1, search = '', status = '') {
    let params = new HttpParams().set('page', page).set('pageSize', 20);
    if (staff && search) params = params.set('search', search);
    if (staff && status) params = params.set('status', status);
    return this.http.get<CirculationPage<Pickup>>('/api/pickup-reservations' + (staff ? '' : '/my'), { params }).pipe(timeout(20000));
  }
  collect(p: Pickup) { return this.http.put(`/api/pickup-reservations/${encodeURIComponent(p.id)}/collect`, { expectedVersion: p.version }).pipe(timeout(20000)); }
  cancel(p: Pickup) { return this.http.put(`/api/pickup-reservations/${encodeURIComponent(p.id)}/cancel`, { expectedVersion: p.version, reason: 'Cancelada por solicitud' }).pipe(timeout(20000)); }
  request(loanId: string, idempotencyKey = crypto.randomUUID()) { return this.http.post(`/api/loans/${encodeURIComponent(loanId)}/renewal-requests`, { reason: null, idempotencyKey }).pipe(timeout(20000)); }
  renewals(staff = false, page = 1, search = '', status = '') {
    let params = new HttpParams().set('page', page).set('pageSize', 20);
    if (staff && search) params = params.set('search', search);
    if (staff && status) params = params.set('status', status);
    return this.http.get<CirculationPage<Renewal>>('/api/renewal-requests' + (staff ? '' : '/my'), { params }).pipe(timeout(20000));
  }
  decide(r: Renewal, approve: boolean, decisionReason: string) { return this.http.put(`/api/renewal-requests/${encodeURIComponent(r.id)}/decision`, { approve, decisionReason, expectedVersion: r.version }).pipe(timeout(20000)); }
}
