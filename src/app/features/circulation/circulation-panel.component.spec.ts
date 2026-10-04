import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { CirculationPanelComponent } from './circulation-panel.component';
import { SessionScopeService } from '../../core/auth/session-scope.service';

describe('CirculationPanelComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [CirculationPanelComponent, NoopAnimationsModule], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] }));
  it('keeps filters after a conflict and reloads the current versions', () => {
    const fixture = TestBed.createComponent(CirculationPanelComponent); const c = fixture.componentInstance; c.staff = true; c.search = 'Atlas';
    fixture.detectChanges(); const http = TestBed.inject(HttpTestingController);
    const flush = () => http.match(r => r.method === 'GET').forEach(r => r.flush({ items: [], totalCount: 0 })); flush();
    spyOn(TestBed.inject(MatDialog), 'open').and.returnValue({ afterClosed: () => of({ reason: '' }) } as any);
    c.collect({ id: 'pickup', version: 4, bookTitle: 'Atlas' } as any);
    const mutation = http.expectOne('/api/pickup-reservations/pickup/collect'); expect(mutation.request.body.expectedVersion).toBe(4);
    mutation.flush({}, { status: 409, statusText: 'Conflict' });
    expect(c.search).toBe('Atlas'); expect(c.message()).toContain('filtros se conservan');
    const reload = http.match(r => r.method === 'GET'); expect(reload.length).toBe(2); reload.forEach(r => { expect(r.request.params.get('search')).toBe('Atlas'); r.flush({ items: [], totalCount: 0 }); }); http.verify();
  });
  it('clears private rows and cancels pending work when identity changes', () => {
    const fixture = TestBed.createComponent(CirculationPanelComponent); fixture.detectChanges(); const http = TestBed.inject(HttpTestingController);
    const requests = http.match(() => true); TestBed.inject(SessionScopeService).invalidate();
    expect(requests.every(r => r.cancelled)).toBeTrue(); expect(fixture.componentInstance.pickups()).toEqual([]); http.verify();
  });
});
