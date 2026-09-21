import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuthService } from '../../../../core/services/auth.service';
import { FavoritesFacade } from '../../data-access/favorites.facade';
import { DiscoverFacade } from '../../data-access/discover.facade';
import { DiscoverPageComponent } from './discover-page.component';
import { CatalogService } from '../../../catalog/data-access/catalog.service';
import { of } from 'rxjs';

describe('DiscoverPageComponent', () => {
  const state = <T>(data: T) => ({ data, loading: false, error: null });

  it('renders a stable hero and filterable category links without carousel controls', () => {
    const book = { id: '1', title: 'La casa', subtitle: null, authors: ['Autora'], coverUrl: null, mediaType: 'physical' as const, genres: ['Historia'], availableCopies: 1, totalCopies: 1, reservationCount: 3, isFavorite: false, isActive: true };
    TestBed.configureTestingModule({ imports: [DiscoverPageComponent, NoopAnimationsModule], providers: [
      provideRouter([]),
      { provide: CatalogService, useValue: { getById: () => of({ ...book, description: 'Historia de una casa.' }) } },
      { provide: AuthService, useValue: { sessionSnapshot: { user: { username: 'Elena' } } } },
      { provide: DiscoverFacade, useValue: { load: jasmine.createSpy('load'), newest: () => state([book]), popular: () => state([book]), popularBooks: () => [book], facets: () => state([{ value: 'Historia', count: 4 }]), activity: () => state(null), activeReading: () => state(null) } },
      { provide: FavoritesFacade, useValue: { busyIds: () => new Set(), isFavorite: () => false, toggle: jasmine.createSpy('toggle') } }
    ] });
    TestBed.overrideComponent(DiscoverPageComponent, { set: { providers: [] } });
    const fixture = TestBed.createComponent(DiscoverPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
    expect(fixture.nativeElement.querySelector('h1').classList).toContain('visually-hidden');
    expect(fixture.nativeElement.querySelector('.welcome')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-carousel]')).toBeNull();
    const category = fixture.nativeElement.querySelector('a[href*="genre=Historia"]') as HTMLAnchorElement;
    expect(category).not.toBeNull();
    expect(category.classList).toContain('category-card--featured');
    expect(category.getAttribute('aria-label')).toContain('4 títulos');
    expect(category.textContent).toContain('01');
    expect(category.textContent).toContain('4 títulos');
  });

  it('hides personal activity sections in a staff preview', async () => {
    await TestBed.configureTestingModule({
      imports: [DiscoverPageComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { sessionSnapshot: { user: { username: 'Admin', role: 'admin' } } } },
        { provide: DiscoverFacade, useValue: { load: jasmine.createSpy('load'), newest: () => state([]), popular: () => state([]), popularBooks: () => [], facets: () => state([]), activity: () => state(null), activeReading: () => state(null) } },
        { provide: FavoritesFacade, useValue: { busyIds: () => new Set(), isFavorite: () => false, toggle: jasmine.createSpy('toggle') } }
      ]
    }).overrideComponent(DiscoverPageComponent, { set: { providers: [] } }).compileComponents();

    const fixture = TestBed.createComponent(DiscoverPageComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).not.toContain('Continúa leyendo');
    expect(text).not.toContain('No pudimos cargar tu resumen');
  });
});
