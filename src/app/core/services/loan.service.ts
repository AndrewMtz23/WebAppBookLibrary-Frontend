// 📁 core/services/loan.service.ts - VERSIÓN COMPLETA
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Loan } from 'src/app/shared/models/loan.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private apiUrl = `${environment.apiUrl}/loans`;

  constructor(private http: HttpClient) {}

  // ✅ PARA ADMIN/LIBRARIAN: Obtener todos los préstamos con detalles
  getAll(): Observable<any> {
    return this.http.get<any>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  // ✅ PARA USUARIOS: Obtener solo sus préstamos
  getByUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/my`)
      .pipe(catchError(this.handleError));
  }

  getById(id: string): Observable<Loan> {
    return this.http.get<Loan>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // ✅ Para "apartar" un libro (crear préstamo)
  create(loanData: any): Observable<any> {
    const requestBody = {
      BookId: loanData.bookId
    };
    
    return this.http.post<any>(this.apiUrl, requestBody)
      .pipe(catchError(this.handleError));
  }

  // ✅ Para marcar como devuelto
  markAsReturned(loanId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${loanId}/return`, {})
      .pipe(catchError(this.handleError));
  }

  // ✅ Para actualizaciones completas (admin/librarian)
  update(id: string, loan: Loan): Observable<Loan> {
    return this.http.put<Loan>(`${this.apiUrl}/${id}`, loan)
      .pipe(catchError(this.handleError));
  }

  // ✅ Para eliminar préstamo (solo admin)
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en LoanService:', error);
    
    let errorMessage = 'Ocurrió un error con los préstamos.';
    
    if (error.status === 405) {
      errorMessage = 'Método no permitido. Verifica la URL.';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado. Inicia sesión nuevamente.';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permisos para esta acción.';
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}