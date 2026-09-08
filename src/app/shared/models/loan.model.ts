export interface Loan {
  id?: string; // ID opcional (Mongo)
  bookId: string;
  userId: string;
  loanDate: string;      // formato ISO (ej. 2025-08-06T15:00:00Z)
  returnDate?: string;   // puede ser null si aún no se ha devuelto
  isReturned: boolean;
}

export type LoanStatus = 'active' | 'overdue' | 'returned' | 'cancelled';

export interface LoanSummary {
  id: string;
  bookId: string;
  userId: string;
  mediaType: 'physical' | 'digital';
  status: LoanStatus;
  reservedAt: string;
  dueAt: string | null;
  returnedAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
}
