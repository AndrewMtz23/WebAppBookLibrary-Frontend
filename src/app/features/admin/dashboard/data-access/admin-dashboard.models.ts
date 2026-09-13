import { DashboardPeriodQuery } from '../../../../shared/dashboard/dashboard-period';
import { DashboardComparison, DashboardRankItem, DashboardSeriesPoint, MetricCount } from '../../../../shared/dashboard/dashboard.models';

export { DashboardComparison, DashboardRankItem, DashboardSeriesPoint, MetricCount } from '../../../../shared/dashboard/dashboard.models';

export interface DashboardBookAttention { id: string; title: string; availableCopies: number; }
export interface DashboardActivityItem { id: string; eventType: string; timestamp: string; actorUsername: string | null; targetType: string | null; targetId: string | null; }
export interface SecuritySummaryWidget { alerts: number; generatedAt: string; }
export interface AdminDashboardResponse {
  generatedAt: string; from: string; to: string; activeUsers: number; totalBooks: number; totalReservations: number;
  usersByRole: MetricCount[]; reservationsByMedia: MetricCount[]; timezone: string; previousFrom: string; previousTo: string;
  activeTitles: number; outstandingReservations: number; overdueReservations: number; periodReservations: DashboardComparison;
  dailyReservations: DashboardSeriesPoint[]; activeTitlesByGenre: MetricCount[]; activeTitlesByMedia: MetricCount[];
  topReservedTitles: DashboardRankItem[]; inactiveAccounts: number; inventoryAttentionTitles: number; inventoryAttention: DashboardBookAttention[];
  lowInventoryTitles: number; outOfStockTitles: number;
}
export type AdminDashboardPeriod = DashboardPeriodQuery;
