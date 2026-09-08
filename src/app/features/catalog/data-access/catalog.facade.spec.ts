import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { BookSummary } from '../../../shared/models/book.model';
import { PagedResult } from '../../../shared/models/paged-result.model';
import { CatalogService } from './catalog.service';
import { CatalogFacade } from './catalog.facade';

describe('CatalogFacade', () => {
  const firstBook = book('first');
  const secondBook = book('second');
  let routeParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let catalog: jasmine.SpyObj<CatalogService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routeParams = new BehaviorSubject(convertToParamMap({ page: '1' }));
    catalog = jasmine.createSpyObj<CatalogService>('CatalogService', ['search']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    TestBed.configureTestingModule({ providers: [
      CatalogFacade,
      { provide: CatalogService, useValue: catalog },
      { provide: ActivatedRoute, useValue: { queryParamMap: routeParams.asObservable() } },
      { provide: Router, useValue: router }
    ] });
  });

  it('keeps the newest response when an older request completes late', () => {
    const first = new Subject<PagedResult<BookSummary>>();
    const second = new Subject<PagedResult<BookSummary>>();
    catalog.search.and.returnValues(first, second);
    const facade = TestBed.inject(CatalogFacade);

    routeParams.next(convertToParamMap({ query: 'second' }));
    second.next(page([secondBook]));
    first.next(page([firstBook]));

    expect(facade.items()).toEqual([secondBook]);
    expect(facade.query().query).toBe('second');
    expect(facade.initialLoading()).toBeFalse();
  });

  it('removes the previous page when filters change', async () => {
    catalog.search.and.returnValue(new Subject<PagedResult<BookSummary>>());
    const facade = TestBed.inject(CatalogFacade);

    await facade.patchQuery({ genre: 'Historia', page: 8 });

    const navigation = router.navigate.calls.mostRecent().args[1];
    expect(navigation?.queryParams).toEqual({ genre: 'Historia' });
  });

  function page(items: readonly BookSummary[]): PagedResult<BookSummary> {
    return { items, page: 1, pageSize: 20, totalItems: items.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false };
  }

  function book(id: string): BookSummary {
    return { id, title: id, subtitle: null, authors: ['Author'], coverUrl: null, mediaType: 'physical', genres: ['Historia'], availableCopies: 1, totalCopies: 1, reservationCount: 0, isFavorite: false, isActive: true };
  }
});
