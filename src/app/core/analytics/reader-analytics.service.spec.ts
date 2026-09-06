import { TestBed } from '@angular/core/testing';
import { READER_ANALYTICS_SINK, ReaderAnalyticsService } from './reader-analytics.service';

describe('ReaderAnalyticsService', () => {
  it('records only search length and never the term itself', () => {
    const sink = { emit: jasmine.createSpy('emit') };
    TestBed.configureTestingModule({ providers: [ReaderAnalyticsService, { provide: READER_ANALYTICS_SINK, useValue: sink }] });
    const analytics = TestBed.inject(ReaderAnalyticsService);
    analytics.trackSearch('Historia médica personal');
    expect(sink.emit).toHaveBeenCalledWith('search', { queryLength: 24 });
    expect(JSON.stringify(sink.emit.calls.mostRecent().args)).not.toContain('Historia');
  });

  it('does not transmit a digital URL or identity-shaped extra data', () => {
    const sink = { emit: jasmine.createSpy('emit') };
    TestBed.configureTestingModule({ providers: [ReaderAnalyticsService, { provide: READER_ANALYTICS_SINK, useValue: sink }] });
    TestBed.inject(ReaderAnalyticsService).trackAction('digital_open', { url: 'https://secret.example/a', email: 'reader@example.com' });
    expect(sink.emit).toHaveBeenCalledWith('digital_open', {});
  });
});
