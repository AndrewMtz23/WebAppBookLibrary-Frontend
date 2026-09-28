import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { timeout } from 'rxjs';
import { LatestReadingResponse, ReadingListResponse, ReadingQuery, ReadingResponse, SaveReadingRequest } from '../models/reading.models';

@Injectable({ providedIn: 'root' })
export class ReadingService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/reading/my';
  list(query: ReadingQuery) {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) if (value !== undefined) params = params.set(key, value);
    return this.http.get<ReadingListResponse>(this.url, { params }).pipe(timeout(20_000));
  }
  latest() { return this.http.get<LatestReadingResponse>(this.url + '/latest').pipe(timeout(20_000)); }
  save(bookId: string, request: SaveReadingRequest) { return this.http.put<ReadingResponse>(this.url + '/books/' + encodeURIComponent(bookId), request).pipe(timeout(20_000)); }
  remove(bookId: string, revision: string) { return this.http.delete<void>(this.url + '/books/' + encodeURIComponent(bookId), { params: { expectedRevision: revision } }).pipe(timeout(20_000)); }
}
