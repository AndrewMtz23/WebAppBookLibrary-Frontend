import { LoanSummary } from '../../../shared/models/loan.model';

export type LoanSection = 'active' | 'dueSoon' | 'overdue' | 'history';

export function sectionFor(loan: LoanSummary, now: Date, dueSoonDays = 3): LoanSection {
  if (loan.status === 'returned' || loan.status === 'cancelled') return 'history';
  if (loan.status === 'overdue') return 'overdue';
  if (loan.mediaType === 'digital' || !loan.dueAt) return 'active';
  const dueTime = Date.parse(loan.dueAt);
  const nowTime = now.getTime();
  if (Number.isFinite(dueTime) && dueTime < nowTime) return 'overdue';
  if (Number.isFinite(dueTime) && dueTime <= nowTime + dueSoonDays * 86_400_000) return 'dueSoon';
  return 'active';
}
