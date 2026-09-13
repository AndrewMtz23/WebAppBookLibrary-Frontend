import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BookSummary } from '../../../../shared/models/book.model';
import { FeaturedBookComponent } from './featured-book.component';

describe('FeaturedBookComponent', () => {
  let fixture: ComponentFixture<FeaturedBookComponent>;

  const book: BookSummary = {
    id: 'metamorphosis',
    title: 'La metamorfosis',
    subtitle: null,
    authors: ['Franz Kafka'],
    coverUrl: null,
    mediaType: 'digital',
    genres: ['Clásicos'],
    availableCopies: null,
    totalCopies: null,
    reservationCount: 0,
    isFavorite: false,
    isActive: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturedBookComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturedBookComponent);
    fixture.componentInstance.book = book;
    fixture.detectChanges();
  });

  it('renders the featured title with readable contrast on the dark panel', () => {
    const title = fixture.nativeElement.querySelector('h2') as HTMLElement;

    expect(getComputedStyle(title).color).toBe('rgb(245, 241, 232)');
  });
});
