import { InjectionToken, Injectable, inject } from '@angular/core';

export type ReaderEvent = 'search' | 'filter' | 'book_open' | 'favorite' | 'reservation' | 'digital_open';
export interface ReaderAnalyticsSink { emit(event: ReaderEvent, payload: Readonly<Record<string, unknown>>): void; }

export const READER_ANALYTICS_SINK = new InjectionToken<ReaderAnalyticsSink>('READER_ANALYTICS_SINK', {
  providedIn: 'root', factory: () => ({ emit: () => undefined })
});

@Injectable({ providedIn: 'root' })
export class ReaderAnalyticsService {
  private readonly sink = inject(READER_ANALYTICS_SINK);

  trackSearch(query: string): void { this.sink.emit('search', { queryLength: Array.from(query).length }); }

  trackFilter(keys: readonly string[]): void {
    const allowed = new Set(['genre', 'mediaType', 'language', 'available', 'sort', 'direction']);
    this.sink.emit('filter', { keys: keys.filter(key => allowed.has(key)).sort() });
  }

  trackAction(event: Exclude<ReaderEvent, 'search' | 'filter'>, _unsafeContext?: unknown): void {
    this.sink.emit(event, {});
  }
}
