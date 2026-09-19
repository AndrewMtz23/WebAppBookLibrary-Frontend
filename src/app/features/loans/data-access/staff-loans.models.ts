import { ParamMap } from '@angular/router';
import { LoanSummary } from '../../../shared/models/loan.model';
export interface StaffLoan extends LoanSummary { bookCoverUrl?: string | null; userAvatarUrl?: string | null; bookTitle: string | null; username: string | null; displayName: string | null; }
export interface StaffLoanDetail { loan: StaffLoan; history: readonly { eventType: 'created' | 'returned' | 'cancelled'; timestamp: string; actorUsername: string | null; source: 'audit' | 'recorded-date' }[]; historyTruncated: boolean; }
export type LoanCommand = 'return' | 'cancel';
export interface StaffLoanQuery { query: string; status: string; mediaType: string; userId: string; bookId: string; from: string; to: string; dueFrom: string; dueTo: string; dateField: string; sort: string; direction: string; page: number; pageSize: number; }
export const DEFAULT_STAFF_LOAN_QUERY: StaffLoanQuery = { query: '', status: '', mediaType: '', userId: '', bookId: '', from: '', to: '', dueFrom: '', dueTo: '', dateField: 'reservedAt', sort: 'reservedAt', direction: 'desc', page: 1, pageSize: 20 };
export function parseLoanQuery(params: ParamMap): StaffLoanQuery {
  const q = { ...DEFAULT_STAFF_LOAN_QUERY };
  for (const key of ['query','userId','bookId'] as const) q[key] = (params.get(key) ?? '').trim().slice(0,200);
  for (const key of ['from','to','dueFrom','dueTo'] as const) { const value = params.get(key); q[key] = value && !isNaN(Date.parse(value)) ? new Date(value).toISOString() : ''; }
  const allowed = { status: ['active','outstanding','overdue','returned','cancelled'], mediaType: ['physical','digital'], dateField: ['reservedAt','returnedAt','cancelledAt'], sort: ['reservedAt','dueAt'], direction: ['asc','desc'] };
  for (const key of Object.keys(allowed) as (keyof typeof allowed)[]) { const value = params.get(key); if (value && allowed[key].includes(value)) q[key] = value; }
  for (const key of ['page','pageSize'] as const) { const n = Number(params.get(key)); if (Number.isSafeInteger(n) && n > 0) q[key] = key === 'pageSize' ? Math.min(n,100) : n; }
  return q;
}
