import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BookDetail, BookSummary } from '../../../shared/models/book.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { BookFacet } from '../../reader/models/reader.models';
import { CatalogQuery } from '../models/catalog-query';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly apiUrl = '/api/books';

  constructor(private readonly http: HttpClient) {}

  search(query: CatalogQuery): Observable<PagedResult<BookSummary>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize)
      .set('sort', query.sort)
      .set('direction', query.direction);
    if (query.query) params = params.set('query', query.query);
    if (query.genre) params = params.set('genre', query.genre);
    if (query.mediaType) params = params.set('mediaType', query.mediaType);
    if (query.language) params = params.set('language', query.language);
    if (query.available !== null) params = params.set('available', query.available);
    return this.http.get<PagedResult<BookSummary>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<BookDetail> {
    return this.http.get<BookDetail>(`${this.apiUrl}/${encodeURIComponent(id)}`);
  }

  getFacets(): Observable<readonly BookFacet[]> {
    return this.http.get<readonly BookFacet[]>(`${this.apiUrl}/facets`);
  }
}
