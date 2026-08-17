export interface Loan {
  id?: string; // ID opcional (Mongo)
  bookId: string;
  userId: string;
  loanDate: string;      // formato ISO (ej. 2025-08-06T15:00:00Z)
  returnDate?: string;   // puede ser null si aún no se ha devuelto
  isReturned: boolean;
}
