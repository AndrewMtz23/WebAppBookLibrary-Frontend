import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoanSummary } from '../../../shared/models/loan.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { DigitalAccess, Favorite, LoanMutationResponse, LoanQuery, ReaderDashboard, ReaderProfile, ReservationResponse } from '../models/reader.models';

@Injectable({ providedIn: 'root' })
export class ReaderService {
  constructor(private readonly http: HttpClient) {}

  getLoans(query: LoanQuery = {}): Observable<PagedResult<LoanSummary>> {
    let params = new HttpParams().set('page', query.page ?? 1).set('pageSize', query.pageSize ?? 20);
    if (query.status) params = params.set('status', query.status);
    if (query.mediaType) params = params.set('mediaType', query.mediaType);
    return this.http.get<PagedResult<LoanSummary>>('/api/loans/my', { params });
  }

  reserve(bookId: string): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>('/api/loans', { bookId });
  }

  returnLoan(loanId: string): Observable<LoanMutationResponse> {
    return this.http.put<LoanMutationResponse>(`/api/loans/${encodeURIComponent(loanId)}/return`, {});
  }

  cancelLoan(loanId: string): Observable<LoanMutationResponse> {
    return this.http.put<LoanMutationResponse>(`/api/loans/${encodeURIComponent(loanId)}/cancel`, {});
  }

  getDigitalAccess(bookId: string): Observable<DigitalAccess> {
    return this.http.get<DigitalAccess>(`/api/books/${encodeURIComponent(bookId)}/digital-access`);
  }

  getFavorites(page = 1, pageSize = 20): Observable<PagedResult<Favorite>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<PagedResult<Favorite>>('/api/favorites', { params });
  }

  addFavorite(bookId: string): Observable<Favorite> {
    return this.http.post<Favorite>(`/api/favorites/${encodeURIComponent(bookId)}`, {});
  }

  removeFavorite(bookId: string): Observable<void> {
    return this.http.delete<void>(`/api/favorites/${encodeURIComponent(bookId)}`);
  }

  getDashboard(): Observable<ReaderDashboard> {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    return this.http.get<ReaderDashboard>('/api/dashboard/reader', { params: new HttpParams().set('timezone', timezone) });
  }

  getProfile(): Observable<ReaderProfile> {
    return this.http.get<ReaderProfile>('/api/profile/me');
  }
}
