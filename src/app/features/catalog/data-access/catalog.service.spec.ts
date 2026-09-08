import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DEFAULT_CATALOG_QUERY } from '../models/catalog-query';
import { CatalogService } from './catalog.service';

describe('CatalogService', () => {
  let service: CatalogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('serializes a typed paginated catalog query', () => {
    service.search({ ...DEFAULT_CATALOG_QUERY, query: 'eco', page: 2 }).subscribe();

    const request = http.expectOne(candidate => candidate.url === '/api/books');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('query')).toBe('eco');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('20');
    expect(request.request.params.has('genre')).toBeFalse();
    request.flush({ items: [], page: 2, pageSize: 20, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: true });
  });

  it('requests detail and genre facets from their direct endpoints', () => {
    service.getById('book-1').subscribe();
    service.getFacets().subscribe();

    const detail = http.expectOne('/api/books/book-1');
    expect(detail.request.method).toBe('GET');
    detail.flush({ id: 'book-1' });
    const facets = http.expectOne('/api/books/facets');
    expect(facets.request.method).toBe('GET');
    facets.flush([{ value: 'Historia', count: 3 }]);
  });
});
