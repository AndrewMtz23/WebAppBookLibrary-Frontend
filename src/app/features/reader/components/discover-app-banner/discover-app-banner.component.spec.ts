import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DiscoverAppBannerComponent } from './discover-app-banner.component';
import { BookSummary } from '../../../../shared/models/book.model';

describe('DiscoverAppBannerComponent carousel', () => {
  const books: BookSummary[] = ['a', 'b', 'c'].map(id => ({ id, title: id, authors: ['Author'], isActive: true, mediaType: 'digital', subtitle: null, coverUrl: null, genres: [], availableCopies: null, totalCopies: null, reservationCount: 0, isFavorite: false }));
  beforeEach(() => TestBed.configureTestingModule({ imports: [DiscoverAppBannerComponent], providers: [provideRouter([])] }));

  it('shuffles without mutating the input, deduplicates and visits every book once per cycle', () => {
    spyOn(Math, 'random').and.returnValue(0);
    const fixture = TestBed.createComponent(DiscoverAppBannerComponent);
    const component = fixture.componentInstance;
    component.books = [...books, books[0], { ...books[0], id: 'inactive', isActive: false }];
    component.activeBookId = 'b';
    component.ngOnChanges();
    expect(component.book?.id).toBe('b');
    expect(component.hasActiveLoan).toBeTrue();
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      seen.push(component.book!.id);
      component.markImageFailed();
      component.next();
      expect(component.imageFailed).toBeFalse();
    }
    expect(new Set(seen).size).toBe(3);
    expect(component.book?.id).toBe(seen[0]);
    expect(books.map(book => book.id)).toEqual(['a', 'b', 'c']);
    fixture.destroy();
  });

  it('pauses automatic changes for interaction and disposes the timer', fakeAsync(() => {
    const fixture = TestBed.createComponent(DiscoverAppBannerComponent);
    fixture.componentRef.setInput('books', books);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.paused = false;
    const first = component.book;
    component.focused = true;
    tick(6000);
    expect(component.book).toBe(first);
    component.focused = false;
    tick(6000);
    expect(component.book).not.toBe(first);
    component.paused = true;
    const pausedBook = component.book;
    tick(6000);
    expect(component.book).toBe(pausedBook);
    fixture.destroy();
    tick(6000);
    expect(component.book).toBe(pausedBook);
  }));
});
