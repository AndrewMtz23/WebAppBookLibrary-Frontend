import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BookSummary } from '../../../../shared/models/book.model';
import { BookCardComponent } from './book-card.component';

describe('BookCardComponent', () => {
  let fixture: ComponentFixture<BookCardComponent>;
  let component: BookCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BookCardComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(BookCardComponent);
    component = fixture.componentInstance;
  });

  it('derives honest actions and availability from media and inventory', () => {
    expect(component.primaryLabel(book({ mediaType: 'physical', availableCopies: 2 }))).toBe('Ver y reservar');
    expect(component.availabilityLabel(book({ mediaType: 'physical', availableCopies: 0 }))).toBe('Sin ejemplares disponibles');
    expect(component.availabilityLabel(book({ mediaType: 'digital', availableCopies: null }))).toBe('Acceso digital');
  });

  it('renders separate link and favorite controls with an accessible title', () => {
    component.book = book({ title: 'El nombre de la rosa', isFavorite: true });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('a')?.textContent).toContain('El nombre de la rosa');
    expect(element.querySelector('a button')).toBeNull();
    expect(element.querySelector<HTMLButtonElement>('button')?.getAttribute('aria-label')).toContain('Quitar');
    expect(element.querySelector('img')?.alt).toContain('El nombre de la rosa');
  });

  it('renders the optimistic favorite state supplied by its container', () => {
    component.book = book({ isFavorite: false });
    component.favoriteState = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button.favorite').getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('button.favorite').getAttribute('aria-label')).toContain('Quitar');
  });

  it('hides the reader-only favorite control in a staff preview', () => {
    component.book = book();
    component.showFavorite = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button.favorite')).toBeNull();
  });

  function book(patch: Partial<BookSummary> = {}): BookSummary {
    return { id: 'b1', title: 'Libro', subtitle: null, authors: ['Autora'], coverUrl: 'https://example.com/cover.jpg', mediaType: 'physical', genres: ['Historia'], availableCopies: 1, totalCopies: 2, reservationCount: 7, isFavorite: false, isActive: true, ...patch };
  }
});
