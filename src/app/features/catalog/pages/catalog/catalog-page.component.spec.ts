import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { of } from 'rxjs';
import { CatalogFiltersComponent } from '../../components/catalog-filters/catalog-filters.component';
import { CatalogSearchComponent } from '../../components/catalog-search/catalog-search.component';
import { CatalogFacade } from '../../data-access/catalog.facade';
import { CatalogService } from '../../data-access/catalog.service';
import { DEFAULT_CATALOG_QUERY } from '../../models/catalog-query';
import { FavoritesFacade } from '../../../reader/data-access/favorites.facade';
import { CatalogFiltersSheetComponent, CatalogPageComponent } from './catalog-page.component';

describe('reader catalog', () => {
  it('debounces search for 300 ms and waits for IME composition', fakeAsync(() => {
    const fixture = TestBed.configureTestingModule({ imports: [CatalogSearchComponent] }).createComponent(CatalogSearchComponent);
    const emitted: string[] = [];
    fixture.componentInstance.searchChanged.subscribe(value => emitted.push(value));
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;

    input.value = 'gab';
    input.dispatchEvent(new Event('input'));
    tick(299);
    expect(emitted).toEqual([]);
    tick(1);
    expect(emitted).toEqual(['gab']);

    input.dispatchEvent(new CompositionEvent('compositionstart'));
    input.value = 'ガブ';
    input.dispatchEvent(new Event('input'));
    tick(400);
    expect(emitted).toEqual(['gab']);
    input.dispatchEvent(new CompositionEvent('compositionend'));
    tick(300);
    expect(emitted).toEqual(['gab', 'ガブ']);
  }));

  it('disables physical availability for digital media and exposes active chips', () => {
    const fixture = TestBed.configureTestingModule({ imports: [CatalogFiltersComponent, NoopAnimationsModule] }).createComponent(CatalogFiltersComponent);
    fixture.componentRef.setInput('query', { ...DEFAULT_CATALOG_QUERY, genre: 'Historia', mediaType: 'digital', available: null });
    fixture.componentRef.setInput('facets', [{ value: 'Historia', count: 4 }]);
    fixture.detectChanges();

    expect(fixture.componentInstance.availabilityDisabled).toBeTrue();
    expect(fixture.componentInstance.activeChips.map(chip => chip.label)).toContain('Historia');
    expect(fixture.nativeElement.textContent).toContain('Más populares');
  });
});

describe('CatalogPageComponent', () => {
  const facade = {
    query: () => DEFAULT_CATALOG_QUERY,
    items: () => [],
    totalItems: () => 0,
    totalPages: () => 0,
    initialLoading: () => false,
    refreshing: () => false,
    error: () => null,
    patchQuery: jasmine.createSpy('patchQuery').and.resolveTo(true),
    clearFilters: jasmine.createSpy('clearFilters').and.resolveTo(true),
    retry: jasmine.createSpy('retry')
  };
  const favorites = { busyIds: () => new Set<string>(), toggle: jasmine.createSpy('toggle') };

  let fixture: ComponentFixture<CatalogPageComponent>;

  beforeEach(() => {
    facade.patchQuery.calls.reset();
    TestBed.configureTestingModule({ imports: [CatalogPageComponent, NoopAnimationsModule], providers: [
      { provide: CatalogFacade, useValue: facade },
      { provide: CatalogService, useValue: { getFacets: () => of([{ value: 'Historia', count: 4 }]) } },
      { provide: FavoritesFacade, useValue: favorites }
    ] });
    fixture = TestBed.createComponent(CatalogPageComponent);
    fixture.detectChanges();
  });

  it('sends server-side query changes and renders an intentional empty state', async () => {
    await fixture.componentInstance.applyPatch({ sort: 'reservationCount', direction: 'desc' });
    expect(facade.patchQuery).toHaveBeenCalledWith({ sort: 'reservationCount', direction: 'desc' });
    expect(fixture.nativeElement.textContent).toContain('No encontramos libros');
  });
});

describe('CatalogFiltersSheetComponent', () => {
  it('collects multiple mobile filters before applying them', () => {
    const ref = { dismiss: jasmine.createSpy('dismiss') };
    TestBed.configureTestingModule({
      imports: [CatalogFiltersSheetComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_BOTTOM_SHEET_DATA, useValue: { query: DEFAULT_CATALOG_QUERY, facets: [] } },
        { provide: MatBottomSheetRef, useValue: ref }
      ]
    });
    const fixture = TestBed.createComponent(CatalogFiltersSheetComponent);

    fixture.componentInstance.update({ mediaType: 'physical' });
    fixture.componentInstance.update({ language: 'es' });
    expect(ref.dismiss).not.toHaveBeenCalled();

    fixture.componentInstance.apply();
    expect(ref.dismiss).toHaveBeenCalledWith({ mediaType: 'physical', language: 'es' });
  });
});
