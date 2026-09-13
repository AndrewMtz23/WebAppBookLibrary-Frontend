import { TestBed } from '@angular/core/testing';
import { DashboardSeriesComponent } from './dashboard-series.component';

describe('DashboardSeriesComponent', () => {
  it('shows an honest empty state for zero data and a zero-based accessible summary for actual data', () => {
    const fixture = TestBed.createComponent(DashboardSeriesComponent);
    fixture.componentRef.setInput('title', 'Reservas'); fixture.componentRef.setInput('periodLabel', '1—2 sep');
    fixture.componentRef.setInput('points', [{ date:'2026-09-01',physical:0,digital:0 }]); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin actividad real');
    expect(fixture.nativeElement.querySelector('[role=img]')).toBeNull();
    fixture.componentRef.setInput('points', [{ date:'2026-09-01',physical:2,digital:1 }]); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=img]').getAttribute('aria-label')).toContain('escala desde cero');
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
  });
});
