import { LoanSummary } from '../../../shared/models/loan.model';
import { sectionFor } from './loan-section';

describe('sectionFor', () => {
  const now = new Date('2026-09-06T12:00:00Z');

  it('classifies by status, medium and a three-day UTC threshold', () => {
    expect(sectionFor(loan('active', 'physical', '2026-09-07T12:00:00Z'), now, 3)).toBe('dueSoon');
    expect(sectionFor(loan('overdue', 'physical', '2026-09-05T12:00:00Z'), now, 3)).toBe('overdue');
    expect(sectionFor(loan('active', 'digital', null), now, 3)).toBe('active');
    expect(sectionFor(loan('returned', 'physical', '2026-09-01T12:00:00Z'), now, 3)).toBe('history');
  });

  function loan(status: LoanSummary['status'], mediaType: LoanSummary['mediaType'], dueAt: string | null): LoanSummary {
    return { id: status + mediaType, bookId: 'book-1', userId: 'user-1', status, mediaType, dueAt, reservedAt: '2026-09-01T12:00:00Z', returnedAt: status === 'returned' ? now.toISOString() : null, cancelledAt: null, notes: null };
  }
});
