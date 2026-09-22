import { LoanSummary, LoanStatus } from '../../../shared/models/loan.model';

export interface BookFacet {
  id?: string; slug?: string; name?: string; value: string; count: number; }
export interface Favorite { id: string; bookId: string; createdAt: string; }
export interface DigitalAccess { resourceUrl: string; }
export interface ReaderProfile {
  id: string; displayName: string; username: string; email: string; avatarUrl?: string | null;
  role: 'user' | 'librarian' | 'admin'; createdAt: string; lastLoginAt: string | null; updatedAt?: string;
}
export interface UpdateProfileRequest { displayName: string; email: string; avatarUrl: string | null; expectedUpdatedAt: string; }
export interface MetricCount { key: string; count: number; }
export interface ReaderDashboard {
  generatedAt: string; from: string; to: string; totalReservations: number;
  favorites: number; byMedia: readonly MetricCount[];
}
export interface LoanQuery {
  status?: LoanStatus;
  mediaType?: 'physical' | 'digital';
  bookId?: string;
  page?: number;
  pageSize?: number;
}
export interface LoanMutationResponse { message: string; idempotent: boolean; }
export interface ReservationResponse { message: string; data: LoanSummary; }
