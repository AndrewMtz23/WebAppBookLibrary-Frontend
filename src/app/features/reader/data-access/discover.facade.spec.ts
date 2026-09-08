import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BookSummary } from '../../../shared/models/book.model';
import { CatalogService } from '../../catalog/data-access/catalog.service';
import { ReaderService } from './reader.service';
import { DiscoverFacade } from './discover.facade';

describe('DiscoverFacade', () => {
  it('keeps resources independent and falls back to newest when popularity fails', () => {
    const newest = [book('new')];
    const catalog = jasmine.createSpyObj<CatalogService>('CatalogService', ['search', 'getFacets']);
    catalog.search.and.returnValues(of(page(newest)), throwError(() => new Error('popular failed')));
    catalog.getFacets.and.returnValue(of([{ value: 'Historia', count: 4 }]));
    const reader = jasmine.createSpyObj<ReaderService>('ReaderService', ['getDashboard', 'getLoans']);
    reader.getDashboard.and.returnValue(throwError(() => new Error('activity failed')));
    reader.getLoans.and.returnValue(of({ items: [], page: 1, pageSize: 1, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false }));
    TestBed.configureTestingModule({ providers: [DiscoverFacade, { provide: CatalogService, useValue: catalog }, { provide: ReaderService, useValue: reader }] });

    const facade = TestBed.inject(DiscoverFacade);
    expect(facade.newest().data).toEqual(newest);
    expect(facade.popular().error).toBeTruthy();
    expect(facade.popularBooks()).toEqual(newest);
    expect(facade.facets().data.length).toBe(1);
    expect(facade.activity().error).toBeTruthy();
    expect(facade.activeReading().data).toBeNull();
  });

  const book = (id: string): BookSummary => ({ id, title: id, subtitle: null, authors: ['Autora'], coverUrl: null, mediaType: 'physical', genres: ['Historia'], availableCopies: 1, totalCopies: 1, reservationCount: 2, isFavorite: false, isActive: true });
  const page = (items: readonly BookSummary[]) => ({ items, page: 1, pageSize: 8, totalItems: items.length, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
});
