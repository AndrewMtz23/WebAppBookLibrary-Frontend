import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LogEntry } from 'src/app/shared/models/log-entry.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private apiUrl = `${environment.apiUrl}/log`;

  constructor(private http: HttpClient) {}

  getRecent(): Observable<LogEntry[]> {
    return this.http.get<LogEntry[]>(`${this.apiUrl}/recent`)
      .pipe(catchError(this.handleError));
  }

  getByLevel(level: string): Observable<LogEntry[]> {
    return this.http.get<LogEntry[]>(`${this.apiUrl}/by-level/${level}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en LogService:', error);
    return throwError(() => new Error('Ocurrió un error al consultar los logs.'));
  }
}
