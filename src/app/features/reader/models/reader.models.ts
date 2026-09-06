import { LoanSummary, LoanStatus } from '../../../shared/models/loan.model';

export interface BookFacet { value: string; count: number; }
export interface Favorite { id: string; bookId: string; createdAt: string; }
export interface DigitalAccess { resourceUrl: string; }
export interface ReaderProfile {
  id: string; displayName: string; username: string; email: string;
  role: 'user'; createdAt: string; lastLoginAt: string | null;
}
export interface MetricCount { key: string; count: number; }
export interface ReaderDashboard {
  generatedAt: string; from: string; to: string; totalReservations: number;
  favorites: number; byMedia: readonly MetricCount[];
}
export interface LoanQuery {
  status?: LoanStatus;
  mediaType?: 'physical' | 'digital';
  page?: number;
  pageSize?: number;
}
export interface LoanMutationResponse { message: string; idempotent: boolean; }
export interface ReservationResponse { message: string; data: LoanSummary; }
