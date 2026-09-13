export interface MetricCount { key: string; count: number; }
export interface DashboardComparison { current: number; previous: number; percentageChange: number | null; }
export interface DashboardRankItem { id: string; label: string; count: number; }
export interface DashboardSeriesPoint { date: string; physical: number; digital: number; }
