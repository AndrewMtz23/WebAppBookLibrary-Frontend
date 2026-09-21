import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BookSummary } from '../../../../shared/models/book.model';
import { FeaturedBookComponent } from './featured-book.component';
import { CatalogService } from '../../data-access/catalog.service';
import { of, Subject } from 'rxjs';

describe('FeaturedBookComponent', () => {
  let fixture: ComponentFixture<FeaturedBookComponent>;
  let catalog: jasmine.SpyObj<CatalogService>;

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
    catalog = jasmine.createSpyObj<CatalogService>('catalog', ['getById']);
    catalog.getById.and.returnValue(of({ ...book, description: 'Una historia sobre la identidad y el cambio.' } as any));
    await TestBed.configureTestingModule({
      imports: [FeaturedBookComponent, RouterTestingModule],
      providers: [{ provide: CatalogService, useValue: catalog }]
    }).compileComponents();

    fixture = TestBed.createComponent(FeaturedBookComponent);
    fixture.componentInstance.book = book;
    fixture.detectChanges();
  });

  it('keeps the description and favorite action attached to the current book despite late responses', () => {
    const oldResponse = new Subject<any>();
    const latestResponse = new Subject<any>();
    catalog.getById.and.returnValues(oldResponse, latestResponse);
    const second = { ...book, id: 'second', title: 'Segundo libro' };
    const third = { ...book, id: 'third', title: 'Tercer libro' };
    fixture.componentRef.setInput('books', [book, second, third]);
    fixture.componentRef.setInput('showFavorite', true);
    fixture.detectChanges();
    fixture.componentInstance.next();
    fixture.componentInstance.next();
    oldResponse.next({ description: 'Stale description' });
    expect(fixture.componentInstance.description).toBe('');
    latestResponse.next({ description: 'Current description' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.featured__synopsis').textContent).toContain('Current description');
    const save = jasmine.createSpy('save');
    fixture.componentInstance.favoriteRequested.subscribe(save);
    fixture.nativeElement.querySelector('.featured__save').click();
    expect(save).toHaveBeenCalledWith(third);
  });

  it('renders the featured title with readable contrast on the dark panel', () => {
    const title = fixture.nativeElement.querySelector('h2') as HTMLElement;

    expect(getComputedStyle(title).color).toBe('rgb(245, 241, 232)');
  });
});
