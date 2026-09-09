import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BookCardComponent } from './features/catalog/components/book-card/book-card.component';
import { SkeletonComponent } from './shared/ui/skeleton/skeleton.component';

// Dedicated entry point: npm run test:reduced-motion launches Chrome with the real media preference.
describe('reader rendered with reduced motion', () => {
  it('uses the reduced media preference and suppresses card transitions and smooth scrolling', () => {
    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBeTrue();
    TestBed.configureTestingModule({ imports: [BookCardComponent], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(BookCardComponent);
    fixture.componentRef.setInput('book', { id: '1', title: 'Libro de prueba', authors: ['Autora'], subtitle: null, coverUrl: null, mediaType: 'physical', genres: [], availableCopies: 1, totalCopies: 1, reservationCount: 0, isFavorite: false, isActive: true });
    fixture.detectChanges();
    const favorite = fixture.nativeElement.querySelector('.favorite') as HTMLElement;
    expect(parseFloat(getComputedStyle(favorite).transitionDuration)).toBeLessThanOrEqual(0.00001);
    expect(getComputedStyle(document.documentElement).scrollBehavior).toBe('auto');
  });

  it('does not leave a skeleton animating indefinitely', () => {
    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBeTrue();
    const fixture = TestBed.configureTestingModule({ imports: [SkeletonComponent] }).createComponent(SkeletonComponent);
    fixture.detectChanges();
    const line = fixture.nativeElement.querySelector('.skeleton__line') as HTMLElement;
    const style = getComputedStyle(line);
    expect(parseFloat(style.animationDuration)).toBeLessThanOrEqual(0.00001);
    expect(style.animationIterationCount).toBe('1');
  });
});
