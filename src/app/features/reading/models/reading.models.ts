export type ReadingStatus = 'want_to_read' | 'reading' | 'finished';
export type ProgressMode = 'percent' | 'page';
export interface SaveReadingRequest {
  status: ReadingStatus; progressMode: ProgressMode; progressPercent: number | null; currentPage: number | null;
  expectedRevision: string | null; confirmReset: boolean; adoptCurrentPageCount: boolean;
}
export interface ReadingResponse {
  bookId: string; revision: string; status: ReadingStatus; progressMode: ProgressMode;
  progressPercent: number; currentPage: number | null; pageCountSnapshot: number | null;
  currentPageCount: number | null; pageCountChanged: boolean;
  startedAt: string | null; finishedAt: string | null; lastProgressAt: string | null; updatedAt: string;
  bookAvailable: boolean; title: string; coverUrl: string | null;
}
export interface ReadingQuery { status?: ReadingStatus; bookId?: string; page?: number; pageSize?: number; }
export interface ReadingListResponse {
  items: readonly ReadingResponse[]; page: number; pageSize: number; totalItems: number;
  counts: { wantToRead: number; reading: number; finished: number };
}
export interface LatestReadingResponse { entry: ReadingResponse | null; }
export const READING_LABELS: Record<ReadingStatus, string> = { want_to_read: 'Quiero leer', reading: 'Leyendo', finished: 'Terminados' };
