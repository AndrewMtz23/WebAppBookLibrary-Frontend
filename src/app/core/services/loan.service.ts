import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessage, ApiResponse } from 'src/app/shared/models/api-response.model';
import { Loan } from 'src/app/shared/models/loan.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly apiUrl = `${environment.apiUrl}/loans`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<Loan[]>> {
    return this.http.get<ApiResponse<Loan[]>>(this.apiUrl);
  }

  getByUser(): Observable<ApiResponse<Loan[]>> {
    return this.http.get<ApiResponse<Loan[]>>(`${this.apiUrl}/my`);
  }

  create(request: { bookId: string }): Observable<ApiResponse<Loan>> {
    return this.http.post<ApiResponse<Loan>>(this.apiUrl, request);
  }

  markAsReturned(loanId: string): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(`${this.apiUrl}/${loanId}/return`, {});
  }

  delete(id: string): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/${id}`);
  }
}
