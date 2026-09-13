import { DashboardPeriodQuery } from '../../../../shared/dashboard/dashboard-period';
import { DashboardComparison, DashboardRankItem, MetricCount } from '../../../../shared/dashboard/dashboard.models';
export interface LibrarianDashboardResponse {
  generatedAt: string; from: string; to: string; totalReservations: number; activeReservations: number; overdueReservations: number;
  activeBooks: number; availablePhysicalCopies: number; byMedia: MetricCount[]; timezone: string; previousFrom: string; previousTo: string;
  returnedPhysical: DashboardComparison; digitalReservations: DashboardComparison; lowInventoryTitles: number; outOfStockTitles: number;
  topReservedTitles: DashboardRankItem[]; titlesWithoutReservations: DashboardRankItem[];
}
export type LibrarianDashboardPeriod = DashboardPeriodQuery;
