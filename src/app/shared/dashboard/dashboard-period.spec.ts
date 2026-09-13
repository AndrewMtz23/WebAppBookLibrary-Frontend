import { convertToParamMap } from '@angular/router';
import { dashboardPeriodFromParams, dashboardQueryParams } from './dashboard-period';

describe('dashboard period URL state', () => {
  it('restores valid local inclusive dates and the IANA timezone', () => {
    const period = dashboardPeriodFromParams(convertToParamMap({ from: '2026-03-07', to: '2026-03-09', timezone: 'America/New_York' }), new Date('2026-09-12T12:00:00Z'), 'UTC');

    expect(period).toEqual({ from: '2026-03-07', to: '2026-03-09', timezone: 'America/New_York' });
    expect(dashboardQueryParams(period)).toEqual({ from: '2026-03-07', to: '2026-03-09', timezone: 'America/New_York' });
  });

  it('falls back to the last 30 local days for invalid dates or a range over 366 days', () => {
    const period = dashboardPeriodFromParams(convertToParamMap({ from: '2024-01-01', to: '2026-09-12', timezone: '' }), new Date('2026-09-12T12:00:00Z'), 'America/Mexico_City');

    expect(period).toEqual({ from: '2026-08-14', to: '2026-09-12', timezone: 'America/Mexico_City' });
  });
});
