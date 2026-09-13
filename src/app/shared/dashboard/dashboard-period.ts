import { ParamMap } from '@angular/router';

export interface DashboardPeriodQuery { from: string; to: string; timezone: string; }

export function dashboardPeriodFromParams(params: ParamMap, now = new Date(), fallbackZone = actualTimezone()): DashboardPeriodQuery {
  const fallback = defaultPeriod(now, fallbackZone);
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const timezone = (params.get('timezone') ?? fallbackZone).trim() || fallbackZone;
  if (!validDate(from) || !validDate(to)) return fallback;
  const days = dateNumber(to) - dateNumber(from) + 1;
  if (days < 1 || days > 366) return fallback;
  try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(now); } catch { return fallback; }
  return { from, to, timezone };
}

export const dashboardQueryParams = (period: DashboardPeriodQuery): Record<string, string> => ({ ...period });
export const actualTimezone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function defaultPeriod(now: Date, timezone: string): DashboardPeriodQuery {
  const to = localDate(now, timezone);
  const fromDate = new Date(`${to}T00:00:00Z`);
  fromDate.setUTCDate(fromDate.getUTCDate() - 29);
  return { from: fromDate.toISOString().slice(0, 10), to, timezone };
}

function localDate(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function dateNumber(value: string): number { return Date.parse(`${value}T00:00:00Z`) / 86400000; }
