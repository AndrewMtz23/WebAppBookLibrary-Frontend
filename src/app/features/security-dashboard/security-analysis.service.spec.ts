import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SecurityAnalysisService, SecurityProbeResult } from './security-analysis.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('SecurityAnalysisService', () => {
  let service: SecurityAnalysisService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [], providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()] });
    service = TestBed.inject(SecurityAnalysisService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('marks a protected endpoint returning 401 as passed', () => {
    const result = service.classify({ name: 'Loans', endpoint: '/api/loans', expectedStatus: 401 }, 401, 25);
    expect(result.status).toBe('passed');
    expect(result.actualStatus).toBe(401);
  });

  it('marks anonymous 200 on a protected endpoint as failed', () => {
    const result = service.classify({ name: 'Loans', endpoint: '/api/loans', expectedStatus: 401 }, 200, 25);
    expect(result.status).toBe('failed');
  });

  it('excludes inconclusive and unavailable probes from the score', () => {
    const make = (status: SecurityProbeResult['status']): SecurityProbeResult => ({
      name: status, endpoint: '/api/test', expectedStatus: 401, actualStatus: null,
      durationMs: 1, checkedAt: new Date(0).toISOString(), status, explanation: status
    });
    const summary = service.calculateSummary([make('passed'), make('failed'), make('inconclusive'), make('unavailable')]);
    expect(summary.score).toBe(50);
    expect(summary.conclusive).toBe(2);
  });

  it('reports a network error as unavailable', () => {
    const result = service.classify({ name: 'Health', endpoint: '/api/health', expectedStatus: 200 }, 0, 25);
    expect(result.status).toBe('unavailable');
    expect(result.explanation).not.toContain('vulnerab');
  });
});
