import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { BookSummary } from '../../../shared/models/book.model';
import { ReaderService } from './reader.service';
import { FavoritesFacade } from './favorites.facade';
import { SessionScopeService } from '../../../core/auth/session-scope.service';

describe('FavoritesFacade', () => {
  let reader: jasmine.SpyObj<ReaderService>;

  beforeEach(() => {
    reader = jasmine.createSpyObj<ReaderService>('ReaderService', ['addFavorite', 'removeFavorite']);
    TestBed.configureTestingModule({ providers: [FavoritesFacade, { provide: ReaderService, useValue: reader }] });
  });

  it('clears personal state and ignores a delayed response after identity changes', () => {
    const response = new Subject<never>();
    reader.addFavorite.and.returnValue(response);
    const facade = TestBed.inject(FavoritesFacade);
    const target = book(false);
    facade.toggle(target);
    TestBed.inject(SessionScopeService).invalidate();
    response.error(new Error('old request'));
    expect(facade.isFavorite(target)).toBeFalse();
    expect(facade.isBusy(target.id)).toBeFalse();
    expect(facade.error()).toBeNull();
  });

  it('updates immediately and ignores a second request while busy', () => {
    const response = new Subject<never>();
    reader.addFavorite.and.returnValue(response);
    const facade = TestBed.inject(FavoritesFacade);
    const target = book(false);

    facade.toggle(target);
    facade.toggle(target);

    expect(facade.isFavorite(target)).toBeTrue();
    expect(facade.isBusy(target.id)).toBeTrue();
    expect(reader.addFavorite).toHaveBeenCalledTimes(1);
  });

  it('rolls back the optimistic state when the request fails', () => {
    const response = new Subject<never>();
    reader.removeFavorite.and.returnValue(response);
    const facade = TestBed.inject(FavoritesFacade);
    const target = book(true);

    facade.toggle(target);
    response.error(new Error('network'));

    expect(facade.isFavorite(target)).toBeTrue();
    expect(facade.isBusy(target.id)).toBeFalse();
    expect(facade.error()).toBe('No pudimos actualizar tus favoritos. Inténtalo de nuevo.');
  });

  function book(isFavorite: boolean): BookSummary {
    return { id: 'b1', title: 'Libro', subtitle: null, authors: ['Autora'], coverUrl: null, mediaType: 'physical', genres: [], availableCopies: 1, totalCopies: 1, reservationCount: 0, isFavorite, isActive: true };
  }
});
