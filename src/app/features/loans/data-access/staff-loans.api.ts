import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { LoanCommand, StaffLoan, StaffLoanDetail, StaffLoanQuery } from './staff-loans.models';
@Injectable({ providedIn: 'root' })
export class StaffLoansApi {
  private readonly http = inject(HttpClient);
  search(query: StaffLoanQuery) { let params = new HttpParams(); for (const [key,value] of Object.entries(query)) if (value !== '') params = params.set(key,value); return this.http.get<PagedResult<StaffLoan>>('/api/loans', { params }); }
  detail(id: string) { return this.http.get<StaffLoanDetail>(`/api/loans/${encodeURIComponent(id)}`); }
  complete(id: string, command: LoanCommand) { return this.http.put<{ idempotent: boolean; message: string }>(`/api/loans/${encodeURIComponent(id)}/${command}`, null); }
}
