import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuthService } from '../../../../core/services/auth.service';
import { FavoritesFacade } from '../../data-access/favorites.facade';
import { DiscoverFacade } from '../../data-access/discover.facade';
import { DiscoverPageComponent } from './discover-page.component';

describe('DiscoverPageComponent', () => {
  it('renders a stable hero and filterable category links without carousel controls', () => {
    const book = { id: '1', title: 'La casa', subtitle: null, authors: ['Autora'], coverUrl: null, mediaType: 'physical' as const, genres: ['Historia'], availableCopies: 1, totalCopies: 1, reservationCount: 3, isFavorite: false, isActive: true };
    const state = <T>(data: T) => ({ data, loading: false, error: null });
    TestBed.configureTestingModule({ imports: [DiscoverPageComponent, NoopAnimationsModule], providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { sessionSnapshot: { user: { username: 'Elena' } } } },
      { provide: DiscoverFacade, useValue: { newest: () => state([book]), popular: () => state([book]), popularBooks: () => [book], facets: () => state([{ value: 'Historia', count: 4 }]), activity: () => state(null) } },
      { provide: FavoritesFacade, useValue: { busyIds: () => new Set(), toggle: jasmine.createSpy('toggle') } }
    ] });
    const fixture = TestBed.createComponent(DiscoverPageComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Elena');
    expect(fixture.nativeElement.querySelector('[data-carousel]')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href*="genre=Historia"]')).not.toBeNull();
  });
});
