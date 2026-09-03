import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from 'src/app/shared/models/api-response.model';
import { LogEntry } from 'src/app/shared/models/log-entry.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly apiUrl = `${environment.apiUrl}/log`;

  constructor(private readonly http: HttpClient) {}

  getRecent(): Observable<ApiResponse<LogEntry[]>> {
    return this.http.get<ApiResponse<LogEntry[]>>(`${this.apiUrl}/recent`);
  }
}
