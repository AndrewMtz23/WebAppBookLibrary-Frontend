import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { AdminDashboardApi } from './admin-dashboard.api';
import { AdminDashboardFacade } from './admin-dashboard.facade';
import { AdminDashboardResponse } from './admin-dashboard.models';

describe('AdminDashboardFacade', () => {
  const core: AdminDashboardResponse = {
    generatedAt: '2026-09-12T12:00:00Z', from: '2026-09-01T06:00:00Z', to: '2026-09-12T06:00:00Z', timezone: 'America/Mexico_City', previousFrom: '2026-08-21T06:00:00Z', previousTo: '2026-09-01T06:00:00Z',
    activeUsers: 3, totalBooks: 8, totalReservations: 2, usersByRole: [], reservationsByMedia: [], activeTitles: 7,
    outstandingReservations: 4, overdueReservations: 1, periodReservations: { current: 2, previous: 0, percentageChange: null },
    dailyReservations: [], activeTitlesByGenre: [], activeTitlesByMedia: [], topReservedTitles: [], inactiveAccounts: 1,
    inventoryAttentionTitles: 1, inventoryAttention: [], lowInventoryTitles: 1, outOfStockTitles: 0
  };
  let api: jasmine.SpyObj<AdminDashboardApi>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(() => {
    api = jasmine.createSpyObj('api', ['summary', 'activity', 'security']);
    api.summary.and.returnValue(of(core));
    api.activity.and.returnValue(throwError(() => ({ status: 503 })));
    api.security.and.returnValue(of({ alerts: 2, generatedAt: core.generatedAt }));
    params = new BehaviorSubject(convertToParamMap({ from: '2026-09-01', to: '2026-09-11', timezone: 'America/Mexico_City' }));
    TestBed.configureTestingModule({ providers: [AdminDashboardFacade, { provide: AdminDashboardApi, useValue: api }, { provide: ActivatedRoute, useValue: { queryParamMap: params } }, { provide: Router, useValue: { navigate: jasmine.createSpy().and.resolveTo(true) } }] });
  });

  it('keeps successful core and security widgets when activity fails independently', () => {
    const facade = TestBed.inject(AdminDashboardFacade);

    expect(facade.data()).toBe(core);
    expect(facade.security()?.alerts).toBe(2);
    expect(facade.activity()).toEqual([]);
    expect(facade.activityError()).toContain('actividad');
    expect(facade.error()).toBe('');
  });

  it('retains prior content and URL period when a refresh fails', () => {
    const facade = TestBed.inject(AdminDashboardFacade);
    api.summary.and.returnValue(throwError(() => ({ status: 500 })));
    facade.refreshCore();

    expect(facade.data()).toBe(core);
    expect(facade.period()).toEqual({ from: '2026-09-01', to: '2026-09-11', timezone: 'America/Mexico_City' });
    expect(facade.error()).toContain('indicadores');
  });

  it('cancels stale dashboard responses after Back or Forward changes the period', () => {
    const facade = TestBed.inject(AdminDashboardFacade);
    const stale = new Subject<AdminDashboardResponse>();
    const current = { ...core, activeUsers: 9 };
    api.summary.and.returnValue(stale); facade.refreshCore();
    api.summary.and.returnValue(of(current));
    params.next(convertToParamMap({ from: '2026-09-05', to: '2026-09-11', timezone: 'UTC' }));
    stale.next(core); stale.complete();

    expect(stale.observed).toBeFalse();
    expect(facade.data()).toBe(current);
    expect(facade.period().timezone).toBe('UTC');
  });
});
