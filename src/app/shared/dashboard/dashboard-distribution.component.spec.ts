import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardDistributionComponent } from './dashboard-distribution.component';

describe('DashboardDistributionComponent', () => {
  it('renders real format proportions and preserves catalog filter links', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(DashboardDistributionComponent);
    fixture.componentRef.setInput('media', [{key:'physical',count:12},{key:'digital',count:6}]);
    fixture.componentRef.setInput('genres', [{key:'Ficción',count:5},{key:'Aventura',count:2}]);
    fixture.detectChanges();
    expect(fixture.componentInstance.total).toBe(18);
    expect(fixture.componentInstance.percentage(6)).toBeCloseTo(100/3);
    expect(fixture.componentInstance.offset(1)).toBeCloseTo(200/3);
    expect(fixture.componentInstance.genreWidth(2)).toBe(40);
    expect(fixture.nativeElement.querySelector('svg').getAttribute('aria-label')).toContain('Físicos: 12');
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toContain('mediaType=physical');
    expect(fixture.nativeElement.textContent).toContain('Un título puede pertenecer a varios géneros');
  });
  it('keeps an empty catalog empty without invalid chart geometry', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(DashboardDistributionComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.percentage(0)).toBe(0);
    expect(fixture.componentInstance.genreWidth(0)).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.ring-segment').length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Todavía no hay títulos activos');
  });
});
