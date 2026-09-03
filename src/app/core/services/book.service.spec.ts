import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { BookService } from './book.service';

describe('BookService', () => {
  let service: BookService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(BookService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the typed books endpoint', () => {
    service.getAll().subscribe(response => expect(response.data).toEqual([]));

    const request = http.expectOne('/api/books');
    expect(request.request.method).toBe('GET');
    request.flush({ message: 'Books retrieved', data: [] });
  });
});
